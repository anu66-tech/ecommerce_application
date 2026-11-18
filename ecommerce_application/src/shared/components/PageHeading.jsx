export function PageHeading({ eyebrow, title, action }) {
  return (
    <div className="admin-page-header">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
      </div>
      {action}
    </div>
  )
}

export default PageHeading
