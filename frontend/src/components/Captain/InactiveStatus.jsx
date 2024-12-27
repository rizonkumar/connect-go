import { MapPin, Clock, FileText, Power } from "lucide-react";

const InactiveStatus = ({
  totalHours,
  totalDistance,
  totalJobs,
  earnings,
  name,
  onGoOnline,
  headerRight,
  isLoading,
}) => {
  const stats = [
    {
      icon: <Clock className="h-6 w-6 text-yellow-600" />,
      value: isLoading ? "..." : totalHours,
      label: "Hours Online",
      bgColor: "bg-yellow-100",
    },
    {
      icon: <MapPin className="h-6 w-6 text-blue-600" />,
      value: isLoading ? "..." : totalDistance,
      label: "KM Distance",
      bgColor: "bg-blue-100",
    },
    {
      icon: <FileText className="h-6 w-6 text-green-600" />,
      value: isLoading ? "..." : totalJobs,
      label: "Total Jobs",
      bgColor: "bg-green-100",
    },
  ];

 return (
   <div className="min-h-screen bg-gray-50">
     {/* Header */}
     <div className="bg-black text-white p-4 flex justify-between items-center">
       <div className="flex items-center gap-2">
         <div className="relative">
           <Power className="h-5 w-5" />
           <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></div>
         </div>
         <span className="font-medium">Offline</span>
       </div>
       <div className="flex items-center gap-3">
         {headerRight || (
           <label className="relative inline-flex items-center cursor-pointer">
             <input type="checkbox" className="sr-only peer" />
             <div className="w-11 h-6 bg-gray-400 rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
           </label>
         )}
       </div>
     </div>

     {/* Map Section */}
     <div className="relative h-[45vh] md:h-[50vh] lg:h-[60vh] bg-gray-200">
       <img
         src="https://miro.medium.com/v2/resize:fit:1400/0*gwMx05pqII5hbfmX.gif"
         alt="Map"
         className="w-full h-full object-cover"
       />
       <div className="absolute inset-0 flex items-center justify-center">
         <div className="bg-white p-4 rounded-full shadow-lg">
           <MapPin className="h-8 w-8 text-gray-400" />
         </div>
       </div>
     </div>

     {/* Stats Card */}
     <div className="bg-white -mt-6 rounded-t-3xl shadow-lg">
       {/* Profile Section */}
       <div className="p-6 border-b">
         <div className="flex items-center gap-4">
           <div className="w-14 h-14 rounded-full overflow-hidden">
             <img
               src="https://randomuser.me/api/portraits/men/32.jpg"
               alt="Profile"
               className="w-full h-full object-cover"
             />
           </div>
           <div>
             <h2 className="text-xl font-semibold">
               {isLoading ? "Loading..." : name || "N/A"}
             </h2>
             <p className="text-gray-500">Basic level</p>
           </div>
           <div className="ml-auto">
             <p className="text-xl font-bold">
               ${isLoading ? "..." : earnings?.toFixed(2) || "0.00"}
             </p>
             <p className="text-gray-500 text-sm text-right">Earned</p>
           </div>
         </div>
       </div>

       {/* Stats Grid */}
       <div className="grid grid-cols-3 gap-4 p-6">
         {stats.map((stat, index) => (
           <div key={index} className="text-center">
             <div
               className={`${stat.bgColor} mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-2`}
             >
               {stat.icon}
             </div>
             <p className="text-2xl font-bold">
               {isLoading ? (
                 <span className="animate-pulse">...</span>
               ) : (
                 stat.value || "0"
               )}
             </p>
             <p className="text-gray-500 text-sm">{stat.label}</p>
           </div>
         ))}
       </div>

       {/* Go Online Button */}
       <div className="p-6">
         <button
           onClick={onGoOnline}
           disabled={isLoading}
           className={`w-full bg-black text-white py-4 rounded-lg font-medium transition-colors ${
             isLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-900"
           }`}
         >
           {isLoading ? "Loading..." : "Go Online"}
         </button>
       </div>
     </div>
   </div>
 );
};

export default InactiveStatus;
