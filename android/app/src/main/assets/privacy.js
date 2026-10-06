const details = await fetch("./privacy-details.json")
  .then((response) => response.json())
  .catch(() => null);
if (details?.publisher && details?.contactEmail) {
  document.getElementById("publisher").textContent = details.publisher;
  document.getElementById("contact").textContent = details.contactEmail;
  document.getElementById("draft").hidden = Boolean(details.privacyUrl);
}
