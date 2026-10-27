import { useEffect, useState } from 'react'
import { Drawer } from 'antd'
import { useLocation } from 'react-router-dom'
import { FiHelpCircle } from 'react-icons/fi'
import { getPageHelp } from '../../constants/pageHelp'
import './index.css'

const PageGuide = () => {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const help = getPageHelp(pathname)

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <>
      <button
        type="button"
        className="page-guide-fab"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="page-guide-fab__icon" aria-hidden="true">
          <FiHelpCircle size={14} />
        </span>
        Guide
      </button>

      <Drawer
        className="page-guide-drawer"
        title="Page guide / पेज गाइड"
        placement="right"
        width={420}
        open={open}
        onClose={() => setOpen(false)}
      >
        <div className="page-guide-body">
          <div>
            <p className="page-guide-kicker">You are on this page</p>
            <h3 className="page-guide-title">{help.titleEn}</h3>
            <p className="page-guide-subtitle">{help.titleHi}</p>
          </div>

          <section className="page-guide-card">
            <h4>English</h4>
            <p>{help.en}</p>
            <ul className="page-guide-list">
              {help.featuresEn.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="page-guide-card page-guide-card--hi">
            <h4>हिन्दी</h4>
            <p>{help.hi}</p>
            <ul className="page-guide-list">
              {help.featuresHi.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </div>
      </Drawer>
    </>
  )
}

export { PageGuide }
