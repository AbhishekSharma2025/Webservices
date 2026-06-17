var express = require('express');
var multer = require('multer');
var router = express.Router();
var supabase = require('../lib/supabase');

var STATIC_PRODUCTS = [
  { name: 'Laptop', cost: 999.99 },
  { name: 'Mouse', cost: 29.99 },
  { name: 'Keyboard', cost: 79.99 }
];

var upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function(req, file, cb) {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

var PRODUCT_FIELDS = 'product_id, name, cost, img_url';

function uploadProductImage(file) {
  var fileName = Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');

  return supabase.storage
    .from('Images')
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    })
    .then(function(uploadResult) {
      if (uploadResult.error) {
        throw uploadResult.error;
      }

      return supabase.storage.from('Images').getPublicUrl(fileName).data.publicUrl;
    });
}

/* GET products listing. */
router.get('/', async function(req, res, next) {
  if (!supabase) {
    return res.json({ source: 'static', products: STATIC_PRODUCTS });
  }

  try {
    var result = await supabase
      .from('products')
      .select(PRODUCT_FIELDS)
      .order('product_id', { ascending: true });

    if (result.error) {
      return res.status(500).json({ error: result.error.message });
    }

    res.json({ source: 'supabase', products: result.data });
  } catch (err) {
    next(err);
  }
});

/* GET single product by product_id. */
router.get('/:product_id', async function(req, res, next) {
  if (!supabase) {
    return res.status(503).json({ error: 'Supabase is not configured' });
  }

  var productId = Number(req.params.product_id);

  if (isNaN(productId) || productId <= 0) {
    return res.status(400).json({ error: 'Valid product_id is required' });
  }

  try {
    var result = await supabase
      .from('products')
      .select(PRODUCT_FIELDS)
      .eq('product_id', productId)
      .maybeSingle();

    if (result.error) {
      return res.status(500).json({ error: result.error.message });
    }

    if (!result.data) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ source: 'supabase', product: result.data });
  } catch (err) {
    next(err);
  }
});

/* POST create product. */
router.post('/', upload.single('image'), async function(req, res, next) {
  if (!supabase) {
    return res.status(503).json({ error: 'Supabase is not configured' });
  }

  var name = req.body.name;
  var cost = req.body.cost;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Product name is required' });
  }

  if (cost === undefined || cost === null || isNaN(Number(cost)) || Number(cost) < 0) {
    return res.status(400).json({ error: 'Valid product cost is required' });
  }

  try {
    var imageUrl = null;

    if (req.file) {
      imageUrl = await uploadProductImage(req.file);
    }

    var result = await supabase
      .from('products')
      .insert({
        name: name.trim(),
        cost: Number(cost),
        img_url: imageUrl
      })
      .select(PRODUCT_FIELDS)
      .single();

    if (result.error) {
      return res.status(500).json({ error: result.error.message });
    }

    res.status(201).json({ source: 'supabase', product: result.data });
  } catch (err) {
    next(err);
  }
});

/* PUT update product by product_id. */
router.put('/:product_id', upload.single('image'), async function(req, res, next) {
  if (!supabase) {
    return res.status(503).json({ error: 'Supabase is not configured' });
  }

  var productId = Number(req.params.product_id);
  var name = req.body.name;
  var cost = req.body.cost;

  if (isNaN(productId) || productId <= 0) {
    return res.status(400).json({ error: 'Valid product_id is required' });
  }

  if (name === undefined && cost === undefined && !req.file) {
    return res.status(400).json({ error: 'At least one of name, cost, or image is required to update' });
  }

  var updates = {};

  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Valid product name is required' });
    }
    updates.name = name.trim();
  }

  if (cost !== undefined) {
    if (cost === null || isNaN(Number(cost)) || Number(cost) < 0) {
      return res.status(400).json({ error: 'Valid product cost is required' });
    }
    updates.cost = Number(cost);
  }

  try {
    if (req.file) {
      updates.img_url = await uploadProductImage(req.file);
    }

    var result = await supabase
      .from('products')
      .update(updates)
      .eq('product_id', productId)
      .select(PRODUCT_FIELDS)
      .maybeSingle();

    if (result.error) {
      return res.status(500).json({ error: result.error.message });
    }

    if (!result.data) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ source: 'supabase', product: result.data });
  } catch (err) {
    next(err);
  }
});

/* DELETE product by product_id. */
router.delete('/:product_id', async function(req, res, next) {
  if (!supabase) {
    return res.status(503).json({ error: 'Supabase is not configured' });
  }

  var productId = Number(req.params.product_id);

  if (isNaN(productId) || productId <= 0) {
    return res.status(400).json({ error: 'Valid product_id is required' });
  }

  try {
    var result = await supabase
      .from('products')
      .delete()
      .eq('product_id', productId)
      .select(PRODUCT_FIELDS)
      .maybeSingle();

    if (result.error) {
      return res.status(500).json({ error: result.error.message });
    }

    if (!result.data) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ source: 'supabase', message: 'Product deleted', product: result.data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
