const STORAGE_KEY = "smartSpendExpensesV1";
const BUDGET_KEY = "smartSpendBudgetV1";
const colors = ["#7259e8", "#36b58a", "#f3a44a", "#4da4dc", "#dc78b5", "#e76f7d", "#a2a1b5"];
const categoryIcons = {Food:"☕",Transport:"🚕",Shopping:"🛍️",Bills:"🧾",Education:"📚",Health:"💊",Other:"✦"};
const $ = (id) => document.getElementById(id);
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};
const sampleExpenses = [
  {id:1,name:"Lunch with friends",amount:280,category:"Food",date:todayISO(),note:"Campus cafe"},
  {id:2,name:"Bus pass",amount:450,category:"Transport",date:todayISO(),note:"Travel"},
  {id:3,name:"Notebook & pens",amount:195,category:"Education",date:todayISO(),note:"Study supplies"},
  {id:4,name:"Monthly mobile recharge",amount:299,category:"Bills",date:todayISO(),note:"Mobile plan"}
];
let expenses = loadExpenses();
let budget = loadBudget();
let showAll = false;
let toastTimer;

function loadExpenses(){
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed.filter(e => e && Number.isFinite(Number(e.amount)) && typeof e.name === "string");
    }
  } catch (error) { console.warn("Could not load saved expenses.", error); }
  return sampleExpenses.map(e => ({...e}));
}
function loadBudget(){
  try {
    const stored = Number(localStorage.getItem(BUDGET_KEY));
    if (Number.isFinite(stored) && stored > 0) return stored;
  } catch (error) { console.warn("Could not load saved budget.", error); }
  return 10000;
}
function persist(){
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    localStorage.setItem(BUDGET_KEY, String(budget));
  } catch (error) {
    showToast("Browser storage is unavailable. Your changes may not persist.");
  }
}
function money(value){
  return new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(value);
}
function formatDate(dateString){
  const d = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateString || "No date";
  return d.toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});
}
function isThisMonth(dateString){
  const d = new Date(`${dateString}T00:00:00`), now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}
function visibleExpenses(){
  const period = $("periodFilter").value;
  return expenses.filter(e => period === "all" || isThisMonth(e.date));
}
function escapeHTML(value){
  return String(value).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}
function render(){
  renderSummary();
  renderChart();
  renderTransactions();
  renderInsight();
}
function renderSummary(){
  const monthly = expenses.filter(e=>isThisMonth(e.date)).reduce((sum,e)=>sum+Number(e.amount),0);
  const remaining = budget-monthly;
  $("totalExpenses").textContent = money(monthly);
  $("budgetAmount").textContent = money(budget);
  $("remainingBudget").textContent = money(remaining);
  $("remainingBudget").style.color = remaining < 0 ? "#d94f65" : "";
  $("remainingNote").textContent = remaining < 0 ? "You've exceeded your budget" : "You're within your budget";
  const used = budget > 0 ? monthly/budget*100 : 0;
  $("budgetProgress").style.width = `${Math.min(100,Math.max(0,used))}%`;
  $("budgetProgress").classList.toggle("over",used>100);
  $("budgetFootnote").textContent = `${Math.round(used)}% of your budget used${used>100?" · Budget exceeded":""}`;
  $("budgetInput").value = budget;
}
function renderChart(){
  const data = visibleExpenses();
  const total = data.reduce((sum,e)=>sum+Number(e.amount),0);
  $("donutTotal").textContent = money(total);
  const totals = {};
  data.forEach(e=>{totals[e.category]=(totals[e.category]||0)+Number(e.amount);});
  const categories = Object.entries(totals).sort((a,b)=>b[1]-a[1]);
  let angle = 0;
  const segments = categories.map(([category,amount],i)=>{
    const next = angle + (total ? amount/total*360 : 0);
    const part = `${colors[i%colors.length]} ${angle}deg ${next}deg`;
    angle = next;
    return part;
  });
  $("donutChart").style.background = segments.length ? `conic-gradient(${segments.join(",")})` : "conic-gradient(#e9e7f4 0deg 360deg)";
  $("categoryLegend").innerHTML = categories.length ? categories.slice(0,5).map(([category,amount],i)=>`
    <div class="legend-item"><span class="legend-swatch" style="background:${colors[i%colors.length]}"></span><span>${escapeHTML(category)}</span><strong>${Math.round(amount/total*100)}%</strong></div>
  `).join("") : '<p class="empty-legend">Add an expense to see your breakdown.</p>';
}
function renderTransactions(){
  const query = $("searchInput").value.trim().toLowerCase();
  const category = $("categoryFilter").value;
  const filtered = expenses.filter(e=>(category==="all"||e.category===category) && `${e.name} ${e.category} ${e.note||""}`.toLowerCase().includes(query))
    .sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id);
  const shown = showAll ? filtered : filtered.slice(0,5);
  $("transactionList").innerHTML = shown.length ? shown.map(e=>`
    <div class="transaction-row">
      <div class="category-icon ${escapeHTML(e.category)}">${categoryIcons[e.category]||"✦"}</div>
      <div class="transaction-info"><strong>${escapeHTML(e.name)}</strong><small>${escapeHTML(e.category)} · ${formatDate(e.date)}</small></div>
      <div class="transaction-amount"><span>−${money(Number(e.amount))}</span><button type="button" data-delete="${e.id}" aria-label="Delete ${escapeHTML(e.name)}">Remove</button></div>
    </div>`).join("") : '<div class="empty-state"><span>◌</span>No expenses found.<br>Try another search or add an expense.</div>';
  $("transactionCount").textContent = filtered.length ? `Showing ${shown.length} of ${filtered.length} transaction${filtered.length===1?"":"s"}` : "No matching transactions";
  $("viewAllBtn").innerHTML = showAll ? 'Show less <span>↑</span>' : 'View all <span>→</span>';
  $("viewAllBtn").style.visibility = filtered.length > 5 ? "visible" : "hidden";
}
function renderInsight(){
  const monthly = expenses.filter(e=>isThisMonth(e.date));
  if(!monthly.length){$("insightText").textContent="Add your first expense to start learning about your spending habits.";return;}
  const totals={};
  monthly.forEach(e=>totals[e.category]=(totals[e.category]||0)+Number(e.amount));
  const top=Object.entries(totals).sort((a,b)=>b[1]-a[1])[0];
  const total=monthly.reduce((sum,e)=>sum+Number(e.amount),0);
  $("insightText").textContent=`You've recorded ${money(total)} this month. ${top ? `${top[0]} is your biggest category at ${money(top[1])}.` : ""}`;
}
function showToast(message){
  const toast=$("toast");toast.textContent=message;toast.classList.add("show");
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove("show"),2800);
}
function openModal(){
  $("expenseModal").hidden=false;$("formError").textContent="";
  $("expenseDate").value=todayISO();
  setTimeout(()=>$("expenseName").focus(),50);
}
function closeModal(){
  $("expenseModal").hidden=true;$("expenseForm").reset();$("formError").textContent="";
  $("openExpenseBtn").focus();
}
$("openExpenseBtn").addEventListener("click",openModal);
$("closeModalBtn").addEventListener("click",closeModal);
$("cancelBtn").addEventListener("click",closeModal);
$("expenseModal").addEventListener("click",e=>{if(e.target===$("expenseModal"))closeModal();});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("expenseModal").hidden)closeModal();});
$("expenseForm").addEventListener("submit",e=>{
  e.preventDefault();
  const name=$("expenseName").value.trim(), amount=Number($("expenseAmount").value);
  const category=$("expenseCategory").value,date=$("expenseDate").value,note=$("expenseNote").value.trim();
  if(!name){$("formError").textContent="Please enter an expense name.";return;}
  if(!Number.isFinite(amount)||amount<=0){$("formError").textContent="Enter an amount greater than zero.";return;}
  if(!date){$("formError").textContent="Please choose a date.";return;}
  expenses.push({id:Date.now(),name,amount,category,date,note});
  persist();render();closeModal();showToast("Expense added successfully.");
});
$("budgetForm").addEventListener("submit",e=>{
  e.preventDefault();const next=Number($("budgetInput").value);
  if(!Number.isFinite(next)||next<=0){showToast("Enter a budget greater than zero.");return;}
  budget=next;persist();render();showToast("Monthly budget updated.");
});
$("periodFilter").addEventListener("change",renderChart);
$("searchInput").addEventListener("input",()=>{showAll=false;renderTransactions();});
$("categoryFilter").addEventListener("change",()=>{showAll=false;renderTransactions();});
$("viewAllBtn").addEventListener("click",()=>{showAll=!showAll;renderTransactions();});
$("transactionList").addEventListener("click",e=>{
  const button=e.target.closest("[data-delete]");if(!button)return;
  const id=Number(button.dataset.delete),item=expenses.find(x=>x.id===id);
  if(!item)return;
  if(!confirm(`Remove "${item.name}" from your transactions?`))return;
  expenses=expenses.filter(x=>x.id!==id);persist();render();showToast("Expense removed.");
});
$("menuToggle").addEventListener("click",()=>{
  const open=$("sidebar").classList.toggle("open");
  $("menuToggle").setAttribute("aria-expanded",String(open));
});
document.querySelectorAll(".nav-link").forEach(link=>link.addEventListener("click",()=>{
  document.querySelectorAll(".nav-link").forEach(a=>a.classList.remove("active"));
  link.classList.add("active");$("sidebar").classList.remove("open");$("menuToggle").setAttribute("aria-expanded","false");
}));
$("year").textContent=new Date().getFullYear();
$("todayLabel").textContent=new Date().toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"});
render();
