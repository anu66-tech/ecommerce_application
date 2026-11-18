import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <Link className="brand" to="/home">
          goodthings<span>.</span>
        </Link>
        <p>Thoughtful things for everyday living.</p>
      </div>
      <div className="footer-bottom">
        <span>© 2026 goodthings studio</span>
        <span>Made for slower, better days.</span>
      </div>
    </footer>
  )
}

export default Footer
