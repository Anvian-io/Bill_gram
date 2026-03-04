export const CheckIsExpanded = () => {
  const nav_expanded_data = localStorage.getItem("IsExpanded");
  console.log(nav_expanded_data, "foiewhfoiehi");
  console.log("window.innerWidth:", window.innerWidth);
  if (nav_expanded_data == "false") {
    return false;
  } else {
    return true;
  }
};
