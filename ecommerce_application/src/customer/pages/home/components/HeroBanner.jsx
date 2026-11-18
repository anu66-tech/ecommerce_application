import { Link } from 'react-router-dom'
import Icon from '../../../../shared/components/Icon.jsx'

export function HeroBanner() {
  return (
    <section className="home-hero">
      <div className="hero-copy">
        <span className="eyebrow">THE GOODTHINGS EVERYDAY EDIT</span>
        <h1>
          Find your next
          <br />
          <em>favorite thing.</em>
        </h1>
        <p>Thoughtful picks for everyday living, all in one happy place.</p>
        <Link className="button button-dark" to="/products">
          Shop now <Icon name="arrow" size={17} />
        </Link>
        <div className="hero-note">
          <span className="note-stars">★★★★★</span>
          <span>Loved by 2,400+ happy homes</span>
        </div>
      </div>
      <div className="hero-image">
        <img
          src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=90"
          alt="A warm, sunlit home with thoughtfully chosen everyday things"
        />
        <div className="hero-image-label">
          <span>GOOD THINGS, EVERY DAY</span>
          <b>A little joy goes a long way.</b>
        </div>
        <span className="hero-stamp">
          made
          <br />
          with care
        </span>
      </div>
    </section>
  )
}

export default HeroBanner
