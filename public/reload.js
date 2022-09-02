if (localStorage.getItem('username')) {
  document.location.href = `${document.location.hostname}:${document.location.port}/dashboard.html?${localStorage.getItem('username')}`
}

else {
  document.location.href = `${document.location.hostname}:${document.location.port}`
}