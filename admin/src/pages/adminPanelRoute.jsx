import { useState } from "react"
import { Outlet } from "react-router-dom"
import Sidebar from "../components/sidebar"

function AdminPanelRoute() {
    const [isCollapsed, setIsCollapsed] = useState(() => {
        try {
            return localStorage.getItem("dukana_sidebar_collapsed") === "true"
        } catch {
            return false
        }
    })

    const toggleSidebar = () => {
        setIsCollapsed(prev => {
            const next = !prev
            try {
                localStorage.setItem("dukana_sidebar_collapsed", String(next))
            } catch {
                // ignore
            }
            return next
        })
    }

    return (
        <div className="min-h-screen bg-background" dir="rtl">
            <Sidebar isCollapsed={isCollapsed} onToggle={toggleSidebar} />
            <main
                className={`min-w-0 p-4 transition-all duration-300 ease-in-out md:p-8 ${
                    isCollapsed ? "md:mr-20" : "md:mr-64"
                }`}
            >
                <Outlet />
            </main>
        </div>
    )
}

export default AdminPanelRoute
