"use client"

import { useState, useEffect, useMemo } from "react"
import Sidebar from "@/components/sidebar"
import EmailList from "@/components/email-list"
import EmailDetail from "@/components/email-detail"
import type { Email, EmailAccount, EmailFolder } from "@/types/email"
import { useMobile } from "@/hooks/use-mobile"
import { useToast } from "@/hooks/use-toast"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"

export default function EmailClient() {
  const [selectedFolder, setSelectedFolder] = useState<EmailFolder>("unified")
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<string>("hello") // Account ID
  const [emails, setEmails] = useState<Email[]>([])
  const [accounts, setAccounts] = useState<EmailAccount[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [detailOpen, setDetailOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isMobile = useMobile()
  const { toast } = useToast()

  // Fetch available email accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
        
        const response = await fetch("/api/emails/accounts", {
          signal: controller.signal
        })
        clearTimeout(timeoutId)
        
        if (response.ok) {
          const data = await response.json()
          setAccounts(data.accounts || [])
        } else {
          console.error("Error fetching accounts: HTTP", response.status)
          setError(`Failed to fetch accounts: ${response.statusText}`)
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.error("Accounts request timeout")
          setError("Request timeout - accounts service is not responding")
        } else {
          console.error("Error fetching accounts:", err)
          setError(`Error fetching accounts: ${err.message}`)
        }
      }
    }
    fetchAccounts()
  }, [])

  // Transform received email from API to Email type
  const transformReceivedEmail = (data: any): Email => ({
    id: data.id,
    from: data.from_name ? `${data.from_name} <${data.from_email}>` : data.from_email,
    to: data.to_emails?.join(", ") || "",
    cc: data.cc_emails?.join(", ") || "",
    subject: data.subject || "(No subject)",
    preview: data.text_body?.substring(0, 100) || data.html_body?.substring(0, 100) || "",
    body: data.html_body || data.text_body || "",
    timestamp: new Date(data.received_at),
    read: data.read || false,
    flagged: data.flagged || false,
    archived: data.archived || false,
    deleted: data.deleted || false,
    snoozed: data.snoozed || false,
    snoozeUntil: data.snooze_until ? new Date(data.snooze_until) : undefined,
    account: "m10djcompany",
    avatar: data.from_email,
    attachments: data.attachments || [],
  })

  // Get the selected account email address
  const selectedAccountEmail = accounts.find((acc) => acc.id === selectedAccount)?.email

  // Fetch emails from API
  const fetchEmails = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Build URL with folder and account filters
      const params = new URLSearchParams({
        folder: selectedFolder,
        limit: "50",
      })
      
      if (selectedAccountEmail) {
        params.append("account", selectedAccountEmail)
      }
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout for emails
      
      const response = await fetch(`/api/emails?${params.toString()}`, {
        signal: controller.signal
      })
      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Failed to fetch emails: ${response.statusText} (HTTP ${response.status})`)
      }

      const data = await response.json()
      const transformedEmails = (data.emails || []).map(transformReceivedEmail)
      setEmails(transformedEmails)
      setError(null) // Clear any previous errors
    } catch (err: any) {
      console.error("Error fetching emails:", err)
      
      if (err.name === 'AbortError') {
        const timeoutError = "Request timeout - emails service is not responding"
        setError(timeoutError)
        toast({
          title: "Error",
          description: timeoutError,
          variant: "destructive",
        })
      } else {
        setError(err.message)
        toast({
          title: "Error",
          description: "Failed to load emails",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch emails on mount and when folder or account changes
  useEffect(() => {
    fetchEmails()
  }, [selectedFolder, selectedAccount])

  // Poll for new emails every 10 seconds, but only if not in error state
  useEffect(() => {
    // Don't poll if we have an error
    if (error) {
      return
    }
    
    const interval = setInterval(fetchEmails, 10000)
    return () => clearInterval(interval)
  }, [selectedFolder, selectedAccount, error])

  // Filter emails based on selected folder
  const filteredEmails = useMemo(() => {
    return emails.filter((email) => {
      if (email.deleted) return false
      if (email.snoozed) return selectedFolder === "snoozed"
      if (email.archived) return selectedFolder === "archived"

      if (selectedFolder === "unified") return !email.archived && !email.snoozed
      if (selectedFolder === "unread") return !email.read && !email.archived && !email.snoozed
      if (selectedFolder === "flagged") return email.flagged && !email.archived && !email.snoozed

      return email.account === selectedFolder && !email.archived && !email.snoozed
    })
  }, [emails, selectedFolder])

  // Close sidebar on mobile by default
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
    } else {
      setSidebarOpen(true)
    }
  }, [isMobile])

  // Close detail view when no email is selected
  useEffect(() => {
    if (!selectedEmail) {
      setDetailOpen(false)
    }
  }, [selectedEmail])

  // Handle email selection and mark as read
  const handleEmailSelect = async (email: Email) => {
    setSelectedEmail(email)

    // Mark as read in UI
    setEmails(emails.map((e) => (e.id === email.id ? { ...e, read: true } : e)))

    // Mark as read in API
    if (!email.read) {
      try {
        await fetch(`/api/emails/${email.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ read: true }),
        })
      } catch (err) {
        console.error("Error marking email as read:", err)
      }
    }

    // Open detail view on mobile
    if (isMobile) {
      setDetailOpen(true)
    }
  }

  // Handle email snooze
  const handleSnoozeEmail = async (emailId: string, snoozeUntil: Date) => {
    // Update UI
    setEmails(emails.map((email) => (email.id === emailId ? { ...email, snoozed: true, snoozeUntil } : email)))

    // Update in API
    try {
      await fetch(`/api/emails/${emailId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snoozed: true, snooze_until: snoozeUntil.toISOString() }),
      })
      toast({
        title: "Email snoozed",
        description: `Until ${snoozeUntil.toLocaleString()}`,
      })
    } catch (err) {
      console.error("Error snoozing email:", err)
      toast({
        title: "Error",
        description: "Failed to snooze email",
        variant: "destructive",
      })
    }
  }

  // Handle email archive
  const handleArchiveEmail = async (emailId: string) => {
    // Update UI
    setEmails(emails.map((email) => (email.id === emailId ? { ...email, archived: true } : email)))

    if (selectedEmail?.id === emailId) {
      setSelectedEmail(null)
    }

    // Update in API
    try {
      await fetch(`/api/emails/${emailId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: true }),
      })
      toast({
        title: "Email archived",
      })
    } catch (err) {
      console.error("Error archiving email:", err)
    }
  }

  // Handle email delete
  const handleDeleteEmail = async (emailId: string) => {
    // Update UI
    setEmails(emails.map((email) => (email.id === emailId ? { ...email, deleted: true } : email)))

    if (selectedEmail?.id === emailId) {
      setSelectedEmail(null)
    }

    // Update in API
    try {
      await fetch(`/api/emails/${emailId}`, {
        method: "DELETE",
      })
      toast({
        title: "Email deleted",
      })
    } catch (err) {
      console.error("Error deleting email:", err)
    }
  }

  // Handle compose/send email
  const handleSendEmail = (email: any) => {
    toast({
      title: "Compose",
      description: "Email composition feature coming soon",
    })
  }

  // Select first email by default
  useEffect(() => {
    if (emails.length > 0 && !selectedEmail) {
      const firstVisibleEmail = filteredEmails[0]
      if (firstVisibleEmail) {
        setSelectedEmail(firstVisibleEmail)
      }
    }
  }, [emails, filteredEmails, selectedEmail])

  return (
    <div className="flex h-screen w-full">
      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? "block" : "hidden"} md:block border-r border-border/50 bg-background/60 backdrop-blur-md`}
      >
        <Sidebar
          accounts={accounts}
          selectedFolder={selectedFolder}
          selectedAccount={selectedAccount}
          onSelectFolder={setSelectedFolder}
          onSelectAccount={setSelectedAccount}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onSendEmail={handleSendEmail}
        />
      </div>

      {/* Main Content with Resizable Panels */}
      {isMobile ? (
        // Mobile view - show either list or detail
        <div className="flex-1">
          {detailOpen && selectedEmail ? (
            <EmailDetail
              email={selectedEmail}
              onClose={() => setDetailOpen(false)}
              onArchive={() => handleArchiveEmail(selectedEmail.id)}
              onDelete={() => handleDeleteEmail(selectedEmail.id)}
              onSnooze={handleSnoozeEmail}
            />
          ) : (
            <EmailList
              emails={filteredEmails}
              selectedEmail={selectedEmail}
              onSelectEmail={handleEmailSelect}
              onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
              onArchiveEmail={handleArchiveEmail}
              onDeleteEmail={handleDeleteEmail}
              onSnoozeEmail={handleSnoozeEmail}
              selectedFolder={selectedFolder}
            />
          )}
        </div>
      ) : (
        // Desktop view - resizable panels
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          <ResizablePanel defaultSize={30} minSize={20}>
            <EmailList
              emails={filteredEmails}
              selectedEmail={selectedEmail}
              onSelectEmail={handleEmailSelect}
              onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
              onArchiveEmail={handleArchiveEmail}
              onDeleteEmail={handleDeleteEmail}
              onSnoozeEmail={handleSnoozeEmail}
              selectedFolder={selectedFolder}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={70}>
            {isLoading ? (
              <div className="flex h-full items-center justify-center text-zinc-500 dark:text-zinc-400">
                <div className="text-center">
                  <p className="mb-2">Loading emails...</p>
                  <div className="animate-spin">⏳</div>
                </div>
              </div>
            ) : error ? (
              <div className="flex h-full items-center justify-center text-red-500 dark:text-red-400">
                <p>{error}</p>
              </div>
            ) : selectedEmail ? (
              <EmailDetail
                email={selectedEmail}
                onClose={() => setSelectedEmail(null)}
                onArchive={() => handleArchiveEmail(selectedEmail.id)}
                onDelete={() => handleDeleteEmail(selectedEmail.id)}
                onSnooze={handleSnoozeEmail}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-zinc-500 dark:text-zinc-400">
                <p>{emails.length === 0 ? "No emails yet" : "Select an email to view"}</p>
              </div>
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </div>
  )
}
