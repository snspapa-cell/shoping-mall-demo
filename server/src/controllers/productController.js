const Product = require('../models/Product');

// @desc    모든 상품 조회
// @route   GET /api/products
const getProducts = async (req, res) => {
  try {
    const { category, minPrice, maxPrice, sort, limit, page } = req.query;
    
    // 필터 조건 생성
    const filter = {};
    
    if (category) {
      filter.category = category;
    }
    
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    
    // 정렬 옵션
    let sortOption = { createdAt: -1 }; // 기본: 최신순
    if (sort === 'price_asc') sortOption = { price: 1 };
    if (sort === 'price_desc') sortOption = { price: -1 };
    if (sort === 'name') sortOption = { name: 1 };
    
    // 페이지네이션 (기본 5개씩)
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 5;
    const skip = (pageNum - 1) * limitNum;
    
    const products = await Product.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);
    
    const total = await Product.countDocuments(filter);
    
    res.json({
      success: true,
      count: products.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '상품 목록 조회 실패',
      error: error.message,
    });
  }
};

// @desc    특정 상품 조회
// @route   GET /api/products/:id
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다.',
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '상품 조회 실패',
      error: error.message,
    });
  }
};

// @desc    SKU로 상품 조회
// @route   GET /api/products/sku/:sku
const getProductBySku = async (req, res) => {
  try {
    const product = await Product.findOne({ sku: req.params.sku.toUpperCase() });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다.',
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '상품 조회 실패',
      error: error.message,
    });
  }
};

// @desc    상품 생성
// @route   POST /api/products
// @access  Admin only
const createProduct = async (req, res) => {
  try {
    const { sku, name, price, category, images, description } = req.body;

    // SKU 중복 확인
    const existingProduct = await Product.findOne({ sku: sku.toUpperCase() });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: '이미 등록된 SKU입니다.',
      });
    }

    const product = await Product.create({
      sku,
      name,
      price,
      category,
      images,
      description,
    });

    res.status(201).json({
      success: true,
      message: '상품이 등록되었습니다.',
      data: product,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '상품 등록 실패',
      error: error.message,
    });
  }
};

// @desc    상품 정보 수정
// @route   PUT /api/products/:id
// @access  Admin only
const updateProduct = async (req, res) => {
  try {
    const { sku, name, price, category, images, description } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다.',
      });
    }

    // SKU 변경 시 중복 확인
    if (sku && sku.toUpperCase() !== product.sku) {
      const existingProduct = await Product.findOne({ sku: sku.toUpperCase() });
      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: '이미 등록된 SKU입니다.',
        });
      }
    }

    // 필드 업데이트
    if (sku) product.sku = sku;
    if (name) product.name = name;
    if (price !== undefined) product.price = price;
    if (category) product.category = category;
    if (images) product.images = images;
    if (description !== undefined) product.description = description;

    await product.save();

    res.json({
      success: true,
      message: '상품 정보가 수정되었습니다.',
      data: product,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: '상품 정보 수정 실패',
      error: error.message,
    });
  }
};

// @desc    상품 삭제
// @route   DELETE /api/products/:id
// @access  Admin only
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다.',
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: '상품이 삭제되었습니다.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '상품 삭제 실패',
      error: error.message,
    });
  }
};

// @desc    카테고리 목록 조회
// @route   GET /api/products/categories
const getCategories = async (req, res) => {
  try {
    res.json({
      success: true,
      data: Product.CATEGORIES,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '카테고리 목록 조회 실패',
      error: error.message,
    });
  }
};

module.exports = {
  getProducts,
  getProductById,
  getProductBySku,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
};

