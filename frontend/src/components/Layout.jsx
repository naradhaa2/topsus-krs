import Sidebar from './Sidebar'

export default function Layout({ children }) {
  return (
    <>
      <Sidebar />
      <div className="pc-container">
        <div className="pc-content">
          {children}
        </div>
      </div>
    </>
  )
}
