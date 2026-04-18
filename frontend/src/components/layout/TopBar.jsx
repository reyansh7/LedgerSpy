import React from 'react'
import { MdSearch, MdNotificationsNone, MdPersonOutline } from 'react-icons/md'

export default function TopBar() {
  return (
    <header className="topbar">
      <div className="topbar__search">
        <span className="topbar__search-icon"><MdSearch /></span>
        <input type="text" placeholder="Search anything..." />
      </div>

      <div className="topbar__actions">
        <button className="topbar__icon-btn" title="Notifications">
          <MdNotificationsNone />
          <span className="topbar__notification-dot"></span>
        </button>
        <button className="topbar__icon-btn" title="Profile">
          <MdPersonOutline />
        </button>
        <div className="topbar__avatar" title="User Profile">
          R
        </div>
      </div>
    </header>
  )
}
