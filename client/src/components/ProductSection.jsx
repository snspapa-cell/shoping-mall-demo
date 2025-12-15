import { memo } from 'react'
import ProductCard from './ProductCard'

const ProductSection = memo(function ProductSection({ 
  title, 
  subtitle, 
  products, 
  variant = 'default',
  label = 'PRODUCT',
  className = ''
}) {
  return (
    <section className={`product-section ${className}`}>
      <div className="section-header">
        <p className="section-subtitle">{subtitle}</p>
        <h2>{title}</h2>
      </div>

      <div className="product-grid">
        {products.map((product, index) => (
          <ProductCard 
            key={`${variant}-${product._id || product.id || index}`}
            product={product} 
            variant={variant}
            label={label}
          />
        ))}
      </div>

      <button className="more-btn">MORE +</button>
    </section>
  )
})

export default ProductSection

