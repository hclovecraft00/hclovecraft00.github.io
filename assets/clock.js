/* same live clock as the home page: "it is currently {time of day} on the {ordinal} {month}" */
const ORD=["","first","second","third","fourth","fifth","sixth","seventh","eighth","ninth","tenth",
  "eleventh","twelfth","thirteenth","fourteenth","fifteenth","sixteenth","seventeenth","eighteenth",
  "nineteenth","twentieth","twenty-first","twenty-second","twenty-third","twenty-fourth","twenty-fifth",
  "twenty-sixth","twenty-seventh","twenty-eighth","twenty-ninth","thirtieth","thirty-first"];
const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
function timeOfDay(h){
  if(h<5)return"late night"; if(h<7)return"early morning"; if(h<12)return"morning";
  if(h===12)return"noon"; if(h<17)return"afternoon"; if(h<21)return"evening"; return"night";
}
function updateClock(){
  const d=new Date();
  document.getElementById("clock").textContent=
    "it is currently "+timeOfDay(d.getHours())+" on the "+ORD[d.getDate()]+" "+MONTHS[d.getMonth()];
}
updateClock(); setInterval(updateClock,30000);
