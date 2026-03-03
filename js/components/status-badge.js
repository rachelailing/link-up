export function statusToBadgeClass(status){
  const s = (status || "").toLowerCase().replace(/\s+/g, "");
  if (["open","pending","awaitingcommitmentfee","awaitingpayment"].includes(s)) return "pending";
  if (["accepted","confirmed","completed"].includes(s)) return "accepted";
  if (["rejected","failed","cancelled"].includes(s)) return "rejected";
  if (["inprogress","submitted"].includes(s)) return "inprogress";
  return "pending";
}