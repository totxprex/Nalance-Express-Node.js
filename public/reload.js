if (localStorage.getItem('username')) {
  document.location.href = `https://nalance.netlify.app/dashboard.html?${localStorage.getItem('username')}`
}

else {
  document.location.href = `https://nalance.netlify.app`
}