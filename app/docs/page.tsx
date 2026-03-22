"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronRight, Users, Ticket, Upload, Mail, Lock, Home } from "lucide-react"

export default function DocsPage() {
  const [selectedTab, setSelectedTab] = useState("getting-started")

  const features = [
    {
      title: "Team Dashboard",
      description: "Comprehensive dashboard for managing tickets, customers, and team members",
      icon: Home,
    },
    {
      title: "Ticket Management",
      description: "Create, track, and resolve support tickets with customer communication",
      icon: Ticket,
    },
    {
      title: "Excel Uploads",
      description: "Upload and view Excel files in table format with multi-sheet support",
      icon: Upload,
    },
    {
      title: "Email Notifications",
      description: "Automatic email alerts for new tickets and customer replies",
      icon: Mail,
    },
    {
      title: "User Management",
      description: "Manage team members with role-based access control",
      icon: Users,
    },
    {
      title: "Security",
      description: "Secure authentication with encrypted passwords and activity logs",
      icon: Lock,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Documentation</h1>
              <p className="text-muted-foreground">Learn how to use the Hazelnutcyborg CRM Platform</p>
            </div>
            <Button asChild>
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5">
            <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
            <TabsTrigger value="team">Team Guide</TabsTrigger>
            <TabsTrigger value="customer">Customer Guide</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
          </TabsList>

          {/* Getting Started Tab */}
          <TabsContent value="getting-started" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
                <CardDescription>Learn how to set up and access the platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      1
                    </span>
                    Access the Platform
                  </h3>
                  <div className="ml-10 space-y-2 text-sm">
                    <p>
                      <strong>For Team Members:</strong> Visit{" "}
                      <code className="bg-muted px-2 py-1 rounded">/team/login</code>
                    </p>
                    <p>
                      <strong>For Customers:</strong> Visit{" "}
                      <code className="bg-muted px-2 py-1 rounded">/customer/login</code>
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      2
                    </span>
                    Login or Register
                  </h3>
                  <div className="ml-10 space-y-2 text-sm">
                    <p>Enter your email and password to log in</p>
                    <p>New users can click the register link to create an account</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      3
                    </span>
                    Explore the Dashboard
                  </h3>
                  <div className="ml-10 space-y-2 text-sm">
                    <p>You'll be redirected to your dashboard after successful login</p>
                    <p>Use the sidebar navigation to access different features</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Guide Tab */}
          <TabsContent value="team" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Member Guide</CardTitle>
                <CardDescription>Complete guide for agents, managers, and admins</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Dashboard Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Dashboard</h3>
                  <p className="text-sm text-muted-foreground">
                    Your main hub for viewing key metrics and quick access to features:
                  </p>
                  <ul className="ml-4 space-y-2 text-sm list-disc">
                    <li>View total customers and active tickets</li>
                    <li>See recent activities and updates</li>
                    <li>Access quick navigation buttons</li>
                  </ul>
                </div>

                {/* Managing Tickets */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Managing Tickets</h3>
                  <p className="text-sm text-muted-foreground">Handle customer support requests:</p>
                  <ul className="ml-4 space-y-2 text-sm list-disc">
                    <li>
                      <strong>View Tickets:</strong> Click "Tickets" to see all tickets
                    </li>
                    <li>
                      <strong>Filter:</strong> Sort by status (open, closed, pending), priority, or customer
                    </li>
                    <li>
                      <strong>Respond:</strong> Click a ticket to view customer messages and respond
                    </li>
                    <li>
                      <strong>Update:</strong> Change ticket status and assign to other team members
                    </li>
                  </ul>
                </div>

                {/* Customer Management */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Managing Customers</h3>
                  <p className="text-sm text-muted-foreground">Add and manage customer information:</p>
                  <ul className="ml-4 space-y-2 text-sm list-disc">
                    <li>
                      <strong>Create:</strong> Click "Create Customer" to add new customers
                    </li>
                    <li>
                      <strong>View:</strong> See all customers with their contact details
                    </li>
                    <li>
                      <strong>Edit:</strong> Update customer information as needed
                    </li>
                    <li>
                      <strong>Upload Files:</strong> Add Excel files to customer profiles
                    </li>
                  </ul>
                </div>

                {/* Excel Files */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Excel File Management</h3>
                  <p className="text-sm text-muted-foreground">Upload and view Excel files:</p>
                  <ul className="ml-4 space-y-2 text-sm list-disc">
                    <li>
                      <strong>Upload:</strong> Go to customer profile and upload Excel files
                    </li>
                    <li>
                      <strong>View:</strong> Click the View button to see data in table format
                    </li>
                    <li>
                      <strong>Sheets:</strong> Switch between multiple sheets using tabs
                    </li>
                    <li>
                      <strong>Download:</strong> Supported formats: xlsx, xls, csv
                    </li>
                  </ul>
                </div>

                {/* Email Notifications */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Email Notifications</h3>
                  <p className="text-sm text-muted-foreground">Receive automatic email alerts:</p>
                  <ul className="ml-4 space-y-2 text-sm list-disc">
                    <li>
                      <strong>Setup:</strong> Go to Profile and enter your Gmail address
                    </li>
                    <li>
                      <strong>Triggers:</strong> Get notified for new tickets and customer replies
                    </li>
                    <li>
                      <strong>Gmail App Password:</strong> Generate at myaccount.google.com/apppasswords
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customer Guide Tab */}
          <TabsContent value="customer" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Guide</CardTitle>
                <CardDescription>How to use the customer portal</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Dashboard */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Dashboard</h3>
                  <p className="text-sm text-muted-foreground">Your personal dashboard shows:</p>
                  <ul className="ml-4 space-y-2 text-sm list-disc">
                    <li>Overview of your submitted tickets</li>
                    <li>Ticket statuses at a glance</li>
                    <li>Recent activities and updates</li>
                  </ul>
                </div>

                {/* Creating Tickets */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Creating Support Tickets</h3>
                  <p className="text-sm text-muted-foreground">Get help from the support team:</p>
                  <ol className="ml-4 space-y-2 text-sm list-decimal">
                    <li>Go to "Tickets" section</li>
                    <li>Click "Create Ticket" button</li>
                    <li>Select product category</li>
                    <li>Enter ticket subject (title)</li>
                    <li>Provide detailed description</li>
                    <li>Optionally attach files</li>
                    <li>Click Submit</li>
                  </ol>
                </div>

                {/* Tracking Tickets */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Tracking Your Tickets</h3>
                  <p className="text-sm text-muted-foreground">Monitor your support requests:</p>
                  <ul className="ml-4 space-y-2 text-sm list-disc">
                    <li>
                      <strong>List:</strong> View all your tickets with status indicators
                    </li>
                    <li>
                      <strong>Details:</strong> Click a ticket to see full details
                    </li>
                    <li>
                      <strong>Messages:</strong> See all communications with support team
                    </li>
                    <li>
                      <strong>Reply:</strong> Send messages to update the support team
                    </li>
                  </ul>
                </div>

                {/* Products */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Viewing Products</h3>
                  <p className="text-sm text-muted-foreground">Browse available products:</p>
                  <ul className="ml-4 space-y-2 text-sm list-disc">
                    <li>Navigate to "Products" section</li>
                    <li>View product list with descriptions</li>
                    <li>Click products for more details</li>
                  </ul>
                </div>

                {/* Profile */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Managing Your Profile</h3>
                  <p className="text-sm text-muted-foreground">Update your account information:</p>
                  <ul className="ml-4 space-y-2 text-sm list-disc">
                    <li>Go to "Profile" section</li>
                    <li>Update contact information</li>
                    <li>Change your password</li>
                    <li>Save changes</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className="rounded-lg bg-primary/10 p-3">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{feature.title}</CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          {/* FAQ Tab */}
          <TabsContent value="faq" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <h4 className="font-semibold">How do I reset my password?</h4>
                  <p className="text-sm text-muted-foreground">
                    Contact your administrator to reset your password. Email support at your registered email for
                    assistance.
                  </p>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <h4 className="font-semibold">Why am I not receiving email notifications?</h4>
                  <p className="text-sm text-muted-foreground">
                    (Team only) Make sure you've entered your Gmail address in your profile and generated an App
                    Password in your Gmail settings. Check your spam folder.
                  </p>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <h4 className="font-semibold">What file formats are supported for Excel uploads?</h4>
                  <p className="text-sm text-muted-foreground">
                    The platform supports .xlsx, .xls, and .csv file formats up to 50MB.
                  </p>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <h4 className="font-semibold">How can I assign a ticket to another team member?</h4>
                  <p className="text-sm text-muted-foreground">
                    Open the ticket details and use the "Assign To" field to select another team member from the
                    dropdown.
                  </p>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <h4 className="font-semibold">Can customers see ticket history?</h4>
                  <p className="text-sm text-muted-foreground">
                    Yes, customers can see all their tickets and the complete communication history with the support
                    team.
                  </p>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <h4 className="font-semibold">How are tickets prioritized?</h4>
                  <p className="text-sm text-muted-foreground">
                    Tickets can be marked as Low, Medium, High, or Urgent. Team members can filter and sort by priority.
                  </p>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <h4 className="font-semibold">Is my data secure?</h4>
                  <p className="text-sm text-muted-foreground">
                    Yes, all passwords are encrypted with bcryptjs, sessions use secure HTTP-only cookies, and all
                    activities are logged for security auditing.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Links */}
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2 flex items-center justify-between">
                Team Login
                <ChevronRight className="h-4 w-4" />
              </h3>
              <p className="text-sm text-muted-foreground mb-4">Access the team dashboard</p>
              <Button asChild variant="ghost" size="sm">
                <Link href="/team/login">Go to Login</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2 flex items-center justify-between">
                Customer Login
                <ChevronRight className="h-4 w-4" />
              </h3>
              <p className="text-sm text-muted-foreground mb-4">Access customer portal</p>
              <Button asChild variant="ghost" size="sm">
                <Link href="/customer/login">Go to Login</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2 flex items-center justify-between">
                API Reference
                <ChevronRight className="h-4 w-4" />
              </h3>
              <p className="text-sm text-muted-foreground mb-4">View available endpoints</p>
              <Button variant="ghost" size="sm" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2 flex items-center justify-between">
                Support
                <ChevronRight className="h-4 w-4" />
              </h3>
              <p className="text-sm text-muted-foreground mb-4">Get help and support</p>
              <Button variant="ghost" size="sm" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
