import React from 'react'
import { MdSearch, MdNotifications, MdSettings, MdHelp } from 'react-icons/md'

export default function Topbar() {
  return (
    <div className="topbar">
      <div className="topbar__search">
        <MdSearch className="topbar__search-icon" />
        <input type="text" placeholder="Search audits, transactions..." />
      </div>
      <div className="topbar__actions">
        <button className="topbar__icon-btn">
          <MdHelp />
        </button>
        <button className="topbar__icon-btn">
          <MdSettings />
        </button>
        <button className="topbar__icon-btn">
          <MdNotifications />
          <span className="topbar__notification-dot"></span>
        </button>
        <div className="topbar__avatar">RS</div>
      </div>
    </div>
  )
}
