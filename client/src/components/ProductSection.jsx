import { memo } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from './ProductCard'
import './ProductSection.css'

const ProductSection = memo(function ProductSection({ 
  title, 
  subtitle, 
  products, 
  variant = 'default',
  label = 'PRODUCT',
  className = '',
  moreLink = '/category'
}) {
  return (
    <section className={`product-section-v2 ${className}`}>
      <div className="section-header-v2">
        <p className="section-subtitle-v2">{subtitle}</p>
        <h2 className="section-title-v2">{title}</h2>
      </div>

      <div className="product-grid-v2">
        {products.map((product, index) => (
          <ProductCard 
            key={`${variant}-${product._id || product.id || index}`}
            product={product} 
            variant={variant}
            label={label}
            index={index}
          />
        ))}
      </div>

      <Link to={moreLink} className="more-btn-v2">
        MORE +
      </Link>
    </section>
  )
})

export default ProductSection

