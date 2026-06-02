import toast from "react-hot-toast";

export const notify = (type, msg) => {
    const baseStyle = {
      fontFamily: "Poppins, sans-serif",
      fontSize: "14px",
      fontWeight: "500",
      padding: "12px 16px",
      borderRadius: "8px",
      boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
    };
  
    if (type === "success") {
      toast.success(msg, {
        duration: 3000,
        position: "top-right",
        style: {
          ...baseStyle,
          background: "#4caf50", // Green
          color: "#fff",
        },
      });
    } else if (type === "error") {
      toast.error(msg, {
        duration: 3000,
        position: "top-right",
        style: {
          ...baseStyle,
          background: "#ef4444", // Red
          color: "#fff",
        },
      });
    } else {
      toast(msg || "⚠️ Be careful! This action cannot be undone.", {
        duration: 4000,
        position: "top-right",
        icon: "⚠️",
        style: {
          ...baseStyle,
          background: "#facc15", // Yellow
          color: "#000",
        },
      });
    }
  };

export const convertToIST = (utcTime)=> {
    const date = new Date(utcTime);
    return date.toLocaleString("en-IN", { 
        timeZone: "Asia/Kolkata", 
        hour12: false 
    }).replace(/:\d{2}$/, ''); // Removes seconds
}

export const formatToYYYYMMDD = (inputDate)=> {
  const date = new Date(inputDate);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); 
  const year = date.getFullYear();
  
  return `${year}-${month}-${day}`;
}


export const formatDate = (inputDate)=> {
  // ip : 2025-03-26T00:00:00.000Z
  // op : 26-Mar-2025 
  
  const date = new Date(inputDate);
  const options = { day: '2-digit', month: 'short', year: 'numeric' };
  return date.toLocaleDateString('en-GB', options).replace(',', '');
}

export const formatCompletionDate = (inputDate)=> {
  // ip : 2025-03-26T00:00:00.000Z
  // op : 26-Mar-2025 
  if(!inputDate){
    return ''
  }

  const date = new Date(inputDate);
  const options = { day: '2-digit', month: 'short', year: 'numeric' };
  return date.toLocaleDateString('en-GB', options).replace(',', '');
}

export const getRelativeOrExactTime = (timestamp)=>{
  const date = new Date(timestamp);
  const now = new Date();

  const diffInSeconds = Math.floor((now - date) / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  if (diffInHours < 24) return `${diffInHours} hr ago`;

  // Format as "HH:mm" if older than 24 hours
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

export const shortenString = (str, maxLength)=> {
  if (str.length <= maxLength) {
      return str;
  }
  return str.slice(0, maxLength) + "...";
}

export const timeAgo = (inputDate)=>{

    const now = new Date();
    const past = new Date(inputDate);
    const seconds = Math.floor((now - past) / 1000);

    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60,
    };

    for (let key in intervals) {
        const value = Math.floor(seconds / intervals[key]);
        if (value >= 1) {
            return `${value} ${key}${value > 1 ? 's' : ''} ago`;
        }
    }

    return "Just now";
}

export const getRelativeDay = (inputDate) => {
  const now = new Date();
  const date = new Date(inputDate);

  // Reset time to midnight for accurate comparison
  now.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  const difference = (date - now) / (1000 * 60 * 60 * 24); // Difference in days

  if (difference === 0) return "Today";
  if (difference === -1) return "Yesterday";
  if (difference === 1) return "Tomorrow";

  // If it's not today, yesterday, or tomorrow, return formatted date
  return date.toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' });
}

export const capitalizeFirstLetter = (text) => {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}




