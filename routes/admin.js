var express = require('express');
var router = express.Router();
var supabase = require('../lib/supabase');
var adminAuth = require('../lib/adminAuth');

var ALLOWED_SORT_FIELDS = {
  product_id: true,
  name: true,
  cost: true
};

var PRODUCT_FIELDS = 'product_id, name, cost, img_url';

function toPositiveInt(value, fallback) {
  var parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function toListValue(value) {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim();
}

router.get('/products/page', function(req, res) {
  res.render('admin/products', { title: 'Admin Product List' });
});

router.get('/products', adminAuth.requireAdmin, async function(req, res, next) {
  if (!supabase) {
    return res.status(503).json({ error: 'Supabase is not configured' });
  }

  var page = toPositiveInt(req.query.page, 1);
  var limit = toPositiveInt(req.query.limit, 20);
  var cappedLimit = Math.min(limit, 100);
  var sortBy = ALLOWED_SORT_FIELDS[req.query.sortBy] ? req.query.sortBy : 'product_id';
  var sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';
  var search = toListValue(req.query.search);
  var from = (page - 1) * cappedLimit;
  var to = from + cappedLimit - 1;

  try {
    var query = supabase
      .from('products')
      .select(PRODUCT_FIELDS, { count: 'exact' });

    if (search) {
      var escapedSearch = search.replace(/,/g, '\\,');
      var productIdSearch = Number(search);

      if (Number.isInteger(productIdSearch) && productIdSearch > 0) {
        query = query.or('name.ilike.%' + escapedSearch + '%,product_id.eq.' + productIdSearch);
      } else {
        query = query.ilike('name', '%' + search + '%');
      }
    }

    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(from, to);

    var result = await query;
    if (result.error) {
      return res.status(500).json({ error: result.error.message });
    }

    var total = result.count || 0;
    var totalPages = total === 0 ? 0 : Math.ceil(total / cappedLimit);

    res.json({
      items: result.data || [],
      page: page,
      limit: cappedLimit,
      total: total,
      totalPages: totalPages
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
