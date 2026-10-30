
import { useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { useCatalog } from "@/hooks/use-data";
import { 
  ArrowLeft, 
  Shield, 
  Users, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  MoreVertical
} from "lucide-react";

const AdminPage = () => {
  const { businesses: companyProfiles, updates: statusUpdates } = useCatalog();
  // State for different tabs in admin interface
  const [activeTab, setActiveTab] = useState<"accounts" | "statuses" | "reports">("accounts");
  
  // Mock data for accounts (based on company profiles)
  const accounts = companyProfiles.map(profile => ({
    ...profile,
    status: ["active", "pending", "inactive"][Math.floor(Math.random() * 3)] as "active" | "pending" | "inactive",
    dateJoined: "2023-09-01",
    lastActive: ["2 hours ago", "1 day ago", "3 days ago", "1 week ago"][Math.floor(Math.random() * 4)]
  }));
  
  // Mock data for pending statuses
  const pendingStatuses = statusUpdates.map(status => ({
    ...status,
    status: ["pending", "approved", "rejected"][Math.floor(Math.random() * 3)] as "pending" | "approved" | "rejected"
  }));
  
  // Mock data for reports
  const reports = [
    {
      id: "report1",
      reportedItemId: "status1",
      reportedItemType: "status",
      reason: "Inappropriate content",
      reportedBy: "user123",
      dateReported: "2023-09-10",
      status: "pending" as const
    },
    {
      id: "report2",
      reportedItemId: "company2",
      reportedItemType: "profile",
      reason: "Misleading information",
      reportedBy: "user456",
      dateReported: "2023-09-09",
      status: "pending" as const
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-whatsapp-light">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl">
        <div className="mb-6">
          <Link to="/" className="flex items-center text-whatsapp-green font-medium">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Exit Admin Panel
          </Link>
        </div>
        
        <div className="flex items-center mb-6">
          <Shield className="w-6 h-6 text-whatsapp-green mr-2" />
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>
        
        {/* Admin navigation tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b">
            <button 
              className={`px-4 py-3 flex items-center ${
                activeTab === "accounts" 
                  ? "border-b-2 border-whatsapp-green text-whatsapp-green font-medium" 
                  : "text-gray-600"
              }`}
              onClick={() => setActiveTab("accounts")}
            >
              <Users className="w-4 h-4 mr-2" />
              Accounts
            </button>
            <button 
              className={`px-4 py-3 flex items-center ${
                activeTab === "statuses" 
                  ? "border-b-2 border-whatsapp-green text-whatsapp-green font-medium" 
                  : "text-gray-600"
              }`}
              onClick={() => setActiveTab("statuses")}
            >
              <Clock className="w-4 h-4 mr-2" />
              Status Approvals
            </button>
            <button 
              className={`px-4 py-3 flex items-center ${
                activeTab === "reports" 
                  ? "border-b-2 border-whatsapp-green text-whatsapp-green font-medium" 
                  : "text-gray-600"
              }`}
              onClick={() => setActiveTab("reports")}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Reports
            </button>
          </div>
        </div>
        
        {/* Content based on active tab */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {activeTab === "accounts" && (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">User Accounts</h2>
                <div className="flex items-center gap-2">
                  <select className="text-sm border rounded-md px-2 py-1">
                    <option>All Accounts</option>
                    <option>Active Accounts</option>
                    <option>Pending Accounts</option>
                    <option>Inactive Accounts</option>
                  </select>
                  <button className="bg-whatsapp-green text-white text-sm px-3 py-1 rounded-md">
                    Export
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-3 text-left">Company</th>
                      <th className="px-4 py-3 text-left">Contact</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Joined</th>
                      <th className="px-4 py-3 text-left">Last Active</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {accounts.map(account => (
                      <tr key={account.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <img 
                              src={account.logo} 
                              alt={account.name}
                              className="w-8 h-8 rounded-full mr-3"
                            />
                            <div>
                              <p className="font-medium">{account.name}</p>
                              <p className="text-gray-500 text-xs">{account.tagline}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{account.email}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            account.status === "active" 
                              ? "bg-green-100 text-green-800" 
                              : account.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}>
                            {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{account.dateJoined}</td>
                        <td className="px-4 py-3 text-gray-600">{account.lastActive}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="relative inline-block">
                            <button className="text-gray-400 hover:text-gray-600">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          
          {activeTab === "statuses" && (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Status Approvals</h2>
                <div className="flex items-center gap-2">
                  <select className="text-sm border rounded-md px-2 py-1">
                    <option>All Statuses</option>
                    <option>Pending Approval</option>
                    <option>Approved</option>
                    <option>Rejected</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-4">
                {pendingStatuses.map(status => (
                  <div key={status.id} className="border rounded-lg p-4">
                    <div className="flex justify-between">
                      <div className="flex items-center">
                        <img 
                          src={status.companyLogo} 
                          alt={status.companyName}
                          className="w-10 h-10 rounded-full mr-3" 
                        />
                        <div>
                          <p className="font-medium">{status.companyName}</p>
                          <p className="text-xs text-gray-500">Posted: {new Date(status.postedAt).toLocaleString()}</p>
                        </div>
                      </div>
                      
                      <div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          status.status === "approved" 
                            ? "bg-green-100 text-green-800" 
                            : status.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}>
                          {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-3 bg-gray-50 p-3 rounded-md">
                      <p className="text-gray-700">{status.content}</p>
                      
                      {status.imageUrl && (
                        <div className="mt-2">
                          <img 
                            src={status.imageUrl} 
                            alt="Status" 
                            className="w-full max-h-40 object-cover rounded-md"
                          />
                        </div>
                      )}
                      
                      {status.link && (
                        <div className="mt-2 text-sm">
                          <p>Link: <a href={status.link.url} className="text-blue-500">{status.link.title}</a></p>
                        </div>
                      )}
                    </div>
                    
                    {status.status === "pending" && (
                      <div className="mt-3 flex justify-end gap-2">
                        <button className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm flex items-center">
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </button>
                        <button className="px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm flex items-center">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
          
          {activeTab === "reports" && (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Reported Content</h2>
              </div>
              
              {reports.length > 0 ? (
                <div className="space-y-4">
                  {reports.map(report => (
                    <div key={report.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">Report #{report.id}</h3>
                          <p className="text-sm text-gray-600">Reported: {report.dateReported}</p>
                          <p className="text-sm">
                            <span className="text-gray-500">Type:</span> {report.reportedItemType === "status" ? "Status Update" : "Profile"}
                          </p>
                          <p className="text-sm">
                            <span className="text-gray-500">Reason:</span> {report.reason}
                          </p>
                        </div>
                        
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                          Pending Review
                        </span>
                      </div>
                      
                      <div className="mt-3 flex justify-end gap-2">
                        <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm">
                          Dismiss
                        </button>
                        <button className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm">
                          Remove Content
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No reports found</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminPage;
