// Menu untuk Instructor
export const instructureMenu = [
  { title: "Dashboard", href: "/instructure/dashboard", icon: "dashboard", exact: true },
  { title: "My Courses", href: "/instructure/my-course", icon: "book", exact: false },
  { title: "Certificate", href: "/instructure/certificate", icon: "certificate", exact: false },
  { title: "Profile", href: "/profile", icon: "user", exact: true },
];

// Menu untuk Participant
export const participantMenu = [
  { title: "Dashboard", href: "/participant/dashboard", icon: "dashboard", exact: true },
  { title: "My Courses", href: "/participant/my-course", icon: "book", exact: false },
  { title: "My Certificate", href: "/participant/my-certificate", icon: "certificate", exact: false },
  { title: "Payment", href: "/participant/payment", icon: "creditCard", exact: false },
  { title: "Profile", href: "/profile", icon: "user", exact: true },
];

// Menu untuk Admin
export const adminMenu = [
  { title: "Dashboard", href: "/dashboard", icon: "dashboard", exact: true },
  { title: "Courses", href: "/courses", icon: "book", exact: true },
  { title: "Course Types", href: "/course-type", icon: "bookmark", exact: true },
  { title: "Course Schedule", href: "/course-schedule", icon: "calendar", exact: true },
  { title: "Certificates", href: "/certificate", icon: "certificate", exact: false },
  { title: "Users", href: "/user", icon: "users", exact: true },
  { title: "User Types", href: "/usertype", icon: "userPlus", exact: true },
  { title: "User Rules", href: "/user-rule", icon: "shield", exact: true },
  { title: "Payment Report", href: "/payment-report", icon: "dollarSign", exact: true },
];
