import { Link } from 'react-router-dom'

export function CategoryPills({ categories = [] }) {
  const allowedCategories = [
    'Electronics',
    'Fashion',
    'Footwear',
    'Beauty',
    'Home',
    'Accessories',
  ]

  return (
    <section className="home-categories">
      <div className="section-heading">
        <div>
          <span className="eyebrow">A LITTLE BIT OF EVERYTHING</span>
          <h2>Shop by category.</h2>
        </div>
      </div>
      <div className="category-grid">
        {categories
          .filter((category) => allowedCategories.includes(category.name))
          .map((category) => (
            <Link
              className="category-tile"
              key={category.id}
              to={`/products?category=${encodeURIComponent(category.name)}`}
            >
              <span>{category.icon || '✳'}</span>
              <b>{category.name}</b>
              <small>Explore collection →</small>
            </Link>
          ))}
      </div>
    </section>
  )
}

export default CategoryPills
