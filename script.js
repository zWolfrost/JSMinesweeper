import Minefield from "https://cdn.jsdelivr.net/npm/@zwolfrost/minesweeper.js@2.3.2/src/minesweeper.min.js" //"../minesweeper.js/src/minesweeper.js"; //CHANGE BEFORE UPLOAD


const BLOCKER = $("#blocker")[0];
const LOADER = $("#loader")[0];

const BOARD = $("#board");

const FLAGSLEFT = $("#flags")[0];
const SMILE = $("#smile");
const TIME = $("#time")[0];

const SIZEBAR = $("#fieldsize");

const CUSTOMWIDTH = $("#customwidth");
const CUSTOMWIDTHCOUNT = $("#customwidthcount")[0];
const CUSTOMHEIGHT = $("#customheight");
const CUSTOMHEIGHTCOUNT = $("#customheightcount")[0];
const CUSTOMMINES = $("#custommines");
const CUSTOMMINESCOUNT = $("#customminescount")[0];

const GAMEOVER = $("#gameover")[0];
const LOSETEXT = $("#losetext")[0];
const WINTEXT = $("#wintext")[0];
const RESTART = $("#restartgame");

const SOLVABLE = $("#createsolvablecheckbox");


let minefield = new Minefield(10, 10);
let time = {beg: null, manage: null};

startGame(false);
resizeBoard();


/*
let ms;
while (minefield.isLost() == false) //minefield.getCellArray().filter(x => x.isOpen).length <= 1//
{
   minefield = new Minefield(10, 10);
   ms = perf(()=>minefield.isSolvableFrom(75, false));
}
setBoard();
console.log(`perf: ${ms}ms`)
*/


//let b = minefield.toMinefield2D();

//b[5][5].isMine = true

//b.resetMines();
//b.openCell(5, 5)

//b.visualDebug(true);

//setBoard();

//setInterval(function()
//{
//   console.log(`isNew: ${minefield.isNew()}\nisGoingOn: ${minefield.isGoingOn()}\nisOver: ${minefield.isOver()}\nisCleared: ${minefield.isCleared()}\nisLost: ${minefield.isLost()}`);
//}, 2000)

//console.log(b.getNearbyCells([5, 3]));


//console.log(minefield.simplify());
//minefield.toMinefield2D().visualDebug(true);


SMILE.on("mousedown", function()
{
   SMILE.removeClass("border1");
   SMILE.addClass("border2");

   SMILE[0].style.paddingTop = "2px";
   SMILE[0].style.paddingLeft = "2px";

   SMILE.one("mouseup mouseleave", function()
   {
      if (window.event.type == "mouseup")
      {
         SMILE.off("mouseleave");

         minefield = new Minefield(minefield.width, minefield.height, minefield.mines);
         startGame(true, false);
      }
      else if (window.event.type == "mouseout") SMILE.off("mouseup");

      SMILE.removeClass("border2");
      SMILE.addClass("border1");

      SMILE[0].style.paddingTop = "0px";
      SMILE[0].style.paddingLeft = "0px";
   });
});


BOARD.on("mousedown", "td", function()
{
   let td = $(this);
   let cell = +this.id;

   if (window.event.which == 1 && minefield[cell].isFlagged == false && minefield.isOver() == false)
   {
      td.removeClass("close border1");
      td.addClass("open");

      SMILE[0].innerText = "????";

      BOARD.one("mouseup mouseleave", function()
      {
         function checkGameOver()
         {
            if (minefield.isLost())
            {
               clearInterval(time.manage);

               SMILE[0].innerText = "????";

               GAMEOVER.style.display = "inline-block";
               LOSETEXT.style.display = "inline-block";
               RESTART[0].style.display = "inline-block";

               animate(BOARD[0], "shake", 0.5);
            }
            else if (minefield.isCleared())
            {
               clearInterval(time.manage);

               GAMEOVER.style.display = "inline-block";
               WINTEXT.style.display = "inline-block";
               RESTART[0].style.display = "inline-block";

               animate(WINTEXT, "shake", 1);
            }
         }

         if (window.event.type == "mouseup")
         {
            BOARD.off("mouseleave");

            if (minefield.isNew())
            {
               if (SOLVABLE[0].checked && minefield.isSolvableFrom(cell) == false)
               {
                  BLOCKER.style.display = "inline";
                  LOADER.style.display = "inline";

                  let findSolvableGameID = setInterval(() =>
                  {
                     let newMinefield = new Minefield(minefield.width, minefield.height, minefield.mines);

                     if (newMinefield.isSolvableFrom(cell))
                     {
                        Object.assign(minefield, newMinefield);

                        BLOCKER.style.display = "none";
                        LOADER.style.display = "none";

                        for (let cellnum of minefield.openCell(cell, true, {nearbyFlagging: false})) setCell(cellnum);

                        time.beg = secsToday();
                        time.manage = setInterval(() => updateTime(), 1000);

                        BOARD[0].style.cursor = "default";

                        checkGameOver();

                        clearInterval(findSolvableGameID);
                     }
                  }, 0);
               }
               else
               {
                  for (let cellnum of minefield.openCell(cell, true, {nearbyFlagging: false})) setCell(cellnum);

                  time.beg = secsToday();
                  time.manage = setInterval(() => updateTime(), 1000);
               }
            }
            else
            {
               for (let cellnum of minefield.openCell(cell, false, {nearbyFlagging: false})) setCell(cellnum);
            }
         }
         else if (window.event.type == "mouseout" && minefield[cell].isOpen == false)
         {
            BOARD.off("mouseup");

            td.removeClass("open");
            td.addClass("close border1");
         }

         SMILE[0].innerText = "????";
         BOARD[0].style.cursor = "default";

         checkGameOver();
      });
   }
});

BOARD.on("contextmenu", "td", function()
{
   window.event.preventDefault();

   let curCell = +this.id;

   if (minefield[curCell].isOpen == false && minefield.isGoingOn())
   {
      if (minefield[curCell].isFlagged == false && FLAGSLEFT.innerText.split(" ")[0] > 0)
      {
         minefield[curCell].isFlagged = true;

         FLAGSLEFT.innerText = +FLAGSLEFT.innerText - 1;

         setFlag($(this));
      }

      else if (minefield[curCell].isFlagged == true)
      {
         minefield[curCell].isFlagged = false;

         FLAGSLEFT.innerText = +FLAGSLEFT.innerText + 1;

         removeFlag($(this));
      }
   }
});

BOARD.on("mouseenter", "td", function()
{
   if (minefield.isOver() == false)
   {
      let curCell = +this.id;

      let nearbyCells = minefield.getNearbyCells(curCell);
      let flagCount = 0, closedCount = 0;

      for (let i=0; i<nearbyCells.length; i++)
      {
         if (minefield[nearbyCells[i]].isFlagged) flagCount++;
         if (minefield[nearbyCells[i]].isOpen == false) closedCount++;
      }

      let numClick = minefield[curCell].mines > 0 && flagCount == minefield[curCell].mines && flagCount < closedCount;

      if (minefield[curCell].isOpen == false || numClick) BOARD[0].style.cursor = "pointer";
      else BOARD[0].style.cursor = "default";
   }
});


$("#hint").on("mousedown", function()
{
   $(this).removeClass("border1");
   $(this).addClass("border2");

   this.style.paddingTop = "2px";
   this.style.paddingLeft = "2px";

   $(this).one("mouseup mouseleave", function()
   {
      function hintAnim(hintobj, mode, callback)
      {
         hintobj.css("animation", "none");
         hintobj.attr("offsetHeight");
         hintobj.css("animation", "none");

         hintobj.css("animation", `yellowFilter 0.2s ${mode}`);

         hintobj.one("animationend", function()
         {
            hintobj.css("animation", "none");

            if (callback != null) callback();
         });
      }

      if (window.event.type == "mouseup")
      {
         $(this).off("mouseleave");

         if (minefield.isGoingOn())
         {
            let hint = minefield.getHint();

            if (hint?.length > 0)
            {
               let hintobj = $("#"+hint.slice(1).join(", #"));

               hintAnim(hintobj, "ease-in-out", () => hintobj.css("filter", "sepia(50%) saturate(220%)"));

               BOARD.one("mousedown", () => hintAnim(hintobj, "reverse", () => hintobj.css("filter", "none")));
            }
            else
            {
               animate(this, "shake", 0.2);
            }
         }
      }
      else if (window.event.type == "mouseout") $(this).off("mouseup");

      $(this).removeClass("border2");
      $(this).addClass("border1");

      this.style.paddingTop = "0px";
      this.style.paddingLeft = "0px";
   });
});

$("#fullscreen").on("mousedown", function()
{
   $(this).removeClass("border1");
   $(this).addClass("border2");

   this.style.paddingTop = "2px";
   this.style.paddingLeft = "2px";

   $(this).one("mouseup mouseleave", function()
   {
      if (window.event.type == "mouseup")
      {
         $(this).off("mouseleave");


         let windowSize = Math.min(window.innerHeight, window.innerWidth);

         let boardMinWidth  = minefield.width*32;
         let boardMinHeight = minefield.height*32;


         if (windowSize < boardMinHeight || windowSize < boardMinWidth)
         {
            BOARD[0].style.width  = boardMinWidth  + "px";
            BOARD[0].style.height = boardMinHeight + "px";
         }
         else if (windowSize > boardMinHeight*2 || windowSize > boardMinWidth*2)
         {
            BOARD[0].style.width  = boardMinWidth*2  + "px";
            BOARD[0].style.height = boardMinHeight*2 + "px";
         }
         else
         {
            let border = BOARD.outerWidth() - BOARD.innerWidth();
            BOARD[0].style.width  = windowSize - border + "px";
            BOARD[0].style.height = windowSize - border + "px";
         }

         resizeSync();

         BOARD[0].scrollIntoView({behavior: "smooth"});
      }
      else if (window.event.type == "mouseout") $(this).off("mouseup");

      $(this).removeClass("border2");
      $(this).addClass("border1");

      this.style.paddingTop = "0px";
      this.style.paddingLeft = "0px";
   });
});

$("#nightmode").on("mousedown", function()
{
   $(this).removeClass("border1");
   $(this).addClass("border2");

   this.style.paddingTop = "2px";
   this.style.paddingLeft = "2px";

   $(this).one("mouseup mouseleave", function()
   {
      if (window.event.type == "mouseup")
      {
         $(this).off("mouseleave");

         let getCSSvar = (name) => getComputedStyle(document.documentElement).getPropertyValue(`--${name}`);
         let setCSSvar = (name, value) => document.documentElement.style.setProperty(`--${name}`, value);

         const KEYS = ["shade-1", "shade-2", "shade-3", "shade-4", "shade-5", "shade-6", "shade-spec-1"];
         const LIGHTMODE = ["white", "whitesmoke", "lightgray", "#999", "gray", "#555", "gray"];
         const DARKMODE = ["#333", "#888", "#666", "#999", "#444", "#BBB", "#AAA"];


         if (getCSSvar(KEYS[0]) == LIGHTMODE[0])
         {
            animate(document.body, "darken", 0.1, {mode: "ease-in", callback: () =>
            {
               for (let i=0; i<KEYS.length; i++)
               {
                  setCSSvar(KEYS[i], DARKMODE[i]);
               }
            }});
         }
         else
         {
            animate(document.body, "darken", 0.1, {mode: "reverse", callback: () =>
            {
               for (let i=0; i<KEYS.length; i++)
               {
                  setCSSvar(KEYS[i], LIGHTMODE[i]);
               }
            }});
         }
      }
      else if (window.event.type == "mouseout") $(this).off("mouseup");

      $(this).removeClass("border2");
      $(this).addClass("border1");

      this.style.paddingTop = "0px";
      this.style.paddingLeft = "0px";
   });
});


RESTART.on("click", function()
{
   minefield = new Minefield(minefield.width, minefield.height, minefield.mines);
   startGame(true, false);
});

SIZEBAR.on("mousedown", function()
{
   const SIZECOUNT = $("#fieldsizecount")[0];

   function setSizeCount()
   {
      let valueRatio = (SIZEBAR[0].value - SIZEBAR[0].max)/(SIZEBAR[0].min - SIZEBAR[0].max);
      SIZECOUNT.style.top = valueRatio*(SIZEBAR[0].offsetWidth-15) + 4 + "px";
      SIZECOUNT.innerText = SIZEBAR[0].value**2;
   }
   function setCustomCount()
   {
      CUSTOMWIDTH[0].value = CUSTOMHEIGHT[0].value = SIZEBAR[0].value;
      CUSTOMWIDTHCOUNT.value = CUSTOMHEIGHTCOUNT.value = SIZEBAR[0].value;
      CUSTOMMINES[0].value = 10;
      CUSTOMMINESCOUNT.value = "1x";
   }

   function countManage()
   {
      setSizeCount();
      setCustomCount();

      const MINES = Math.floor(+SIZEBAR[0].value*+SIZEBAR[0].value/5)*(+CUSTOMMINES[0].value/10);
      minefield = new Minefield(+SIZEBAR[0].value, +SIZEBAR[0].value, MINES);

      startGame();
      resizeBoard();
   }

   setSizeCount();

   SIZECOUNT.style.display = "inline";

   SIZEBAR.on("input", countManage);

   $(window).on("mouseup", function()
   {
      SIZECOUNT.style.display = "none";

      SIZEBAR.off("input")
      $(window).off("mouseup")
   });
});

$("#customfieldsizeexpand").on("click", function()
{
   const CUSTOMSIZECONT = $("#customfieldsizecontainer")[0];

   if ($(this).hasClass("fa-chevron-left"))
   {
      $(this).removeClass("fa-chevron-left");
      $(this).addClass("fa-chevron-right");
      animate(CUSTOMSIZECONT, "left", 0.2, {mode: "ease-in-out", callback: () => CUSTOMSIZECONT.style.right = "0px"});
   }

   else if ($(this).hasClass("fa-chevron-right"))
   {
      $(this).removeClass("fa-chevron-right");
      $(this).addClass("fa-chevron-left");
      animate(CUSTOMSIZECONT, "left", 0.2, {mode: "reverse", callback: () => CUSTOMSIZECONT.style.right = "-300px"});
   }
});

CUSTOMWIDTH.on("input", function()
{
   CUSTOMWIDTHCOUNT.value = CUSTOMWIDTH[0].value;

   const MINES = Math.floor(+CUSTOMWIDTH[0].value*+CUSTOMHEIGHT[0].value/5)*(+CUSTOMMINES[0].value/10);

   minefield = new Minefield(+CUSTOMWIDTH[0].value, +CUSTOMHEIGHT[0].value, MINES);

   startGame();
   resizeBoard();
});
CUSTOMHEIGHT.on("input", function()
{
   CUSTOMHEIGHTCOUNT.value = CUSTOMHEIGHT[0].value;

   const MINES = Math.floor(+CUSTOMWIDTH[0].value*+CUSTOMHEIGHT[0].value/5)*(+CUSTOMMINES[0].value/10);

   minefield = new Minefield(+CUSTOMWIDTH[0].value, +CUSTOMHEIGHT[0].value, MINES);

   startGame();
   resizeBoard();
});
CUSTOMMINES.on("input", function()
{
   CUSTOMMINESCOUNT.value = (CUSTOMMINES[0].value/10)+"x";

   const MINES = Math.floor(+CUSTOMWIDTH[0].value*+CUSTOMHEIGHT[0].value/5)*(+CUSTOMMINES[0].value/10);

   minefield = new Minefield(+CUSTOMWIDTH[0].value, +CUSTOMHEIGHT[0].value, MINES);

   startGame(false, false);
});

SOLVABLE.on("click", () => animate(SOLVABLE[0], "bigBounce", 0.2));


$(window).on("unload", function()
{
   if (minefield.isGoingOn())
   {
      localStorage.setItem("minefield", JSON.stringify(minefield));
      localStorage.setItem("time", secsToday() - time.beg);
   }
});
$(window).on("load", function()
{
   if (localStorage.getItem("minefield") != null)
   {
      let newMinefield = JSON.parse(localStorage.getItem("minefield"));
      let newTime = secsToday() - localStorage.getItem("time");

      loadGame(newMinefield, newTime);

      localStorage.removeItem("minefield");
      localStorage.removeItem("time");
   }
});



function startGame(anim=true, ui=true)
{
   FLAGSLEFT.innerText = minefield.mines;
   SMILE[0].innerText = "????";
   TIME.innerText = "00:00";

   GAMEOVER.style.display = "none";
   LOSETEXT.style.display = "none";
   WINTEXT.style.display = "none";
   RESTART[0].style.display = "none";

   if (anim) animate(BOARD[0], "bounce", 0.1);

   if (ui) createMinefieldUI(BOARD[0], minefield.width, minefield.height);
   else setBoard();

   clearInterval(time.manage);
};
function loadGame(newMinefield, newTimeBeg)
{
   Object.assign(minefield, newMinefield);

   createMinefieldUI(BOARD[0], minefield.width, minefield.height);

   resizeBoard();
   setBoard();

   time.beg = newTimeBeg;
   time.manage = setInterval(() => updateTime(), 1000);

   FLAGSLEFT.innerText = (minefield.mines - minefield.usedFlags);

   GAMEOVER.style.display = "none";
   LOSETEXT.style.display = "none";
   WINTEXT.style.display = "none";
   RESTART[0].style.display = "none";

   SIZEBAR[0].value = minefield.height;

   updateTime();
};


function createMinefieldUI(tableEl, width, height, reset=true)
{
   if (reset) tableEl.innerHTML = "";

   const DEFTD = document.createElement("td");
   DEFTD.className = "close border1";
   DEFTD.appendChild(document.createElement("div"));

   for (let i=0; i<height; i++)
   {
      const TR = document.createElement("tr");
      tableEl.appendChild(TR);

      for (let j=0; j<width; j++)
      {
         const TD = DEFTD.cloneNode(true);

         TD.id = i*width+j;

         TR.appendChild(TD);
      }
   }

   return 0;
};


function setBoard()
{
   for (let i=0; i<minefield.cells; i++)
   {
      setCell(i);

      if (minefield[i].isFlagged) setFlag($("#"+i), false);
   }

   FLAGSLEFT.innerText = (minefield.mines - minefield.usedFlags);
};

function setCell(cellnum)
{
   const cellobj = $(`#${cellnum}`);
   const DIV = cellobj.children("div")[0];

   if (minefield[cellnum].isOpen)
   {
      cellobj.removeClass("close border1");
      cellobj.addClass("open");

      if (minefield[cellnum].isMine)
      {
         DIV.innerText = "????";
         DIV.style.paddingRight = "calc(20px - 40%)";
         DIV.style.paddingBottom = "10%";
      }
      else if (minefield[cellnum].mines != 0)
      {
         DIV.innerText = minefield[cellnum].mines;
         DIV.style.paddingRight = "0px";
         DIV.style.paddingBottom = "0px";
         DIV.style.marginTop = "2px";

         switch (minefield[cellnum].mines)
         {
            case 1: DIV.style.color = "blue"    ; break;
            case 2: DIV.style.color = "green"   ; break;
            case 3: DIV.style.color = "red"     ; break;
            case 4: DIV.style.color = "darkblue"; break;
            case 5: DIV.style.color = "brown"   ; break;
            case 6: DIV.style.color = "darkcyan"; break;
            case 7: DIV.style.color = "black"   ; break;
            case 8: DIV.style.color = "gray"    ; break;
         }
      }
   }
   else
   {
      cellobj[0].className = "close border1";
      DIV.innerHTML = "";
   }
};
function setFlag(cellobj, anim=true)
{
   const flag = cellobj.find("div")[0];

   flag.innerText = "????";

   flag.style.paddingRight = "calc(20px - 40%)";
   flag.style.paddingBottom = "10%";

   if (anim) animate(flag, "flagin", 0.1);
};
function removeFlag(cellobj)
{
   const flag = cellobj.find("div")[0];

   animate(flag, "flagout", 0.04, {callback: () =>
   {
      flag.innerText = "";
      flag.style.paddingRight = "0px";
      flag.style.paddingBottom = "0px";
   }});
};


function resizeBoard()
{
   function getSizeMultiplier()
   {
      let sizeMultiplier = 1.5;

      if (BOARD.resizable("instance") != undefined)
      {
         let addWidth = BOARD[0].style.width.slice(0,-2) / BOARD.resizable("option", "minWidth");
         let addHeight = BOARD[0].style.height.slice(0,-2) / BOARD.resizable("option", "minHeight");

         sizeMultiplier = (addWidth + addHeight)/2;

         if (sizeMultiplier < 1) sizeMultiplier = 1;
         if (sizeMultiplier > 2) sizeMultiplier = 2;
      }

      return sizeMultiplier;
   };

   let sizeMultiplier = getSizeMultiplier();

   let boardMinWidth  = minefield.width*32;
   let boardMinHeight = minefield.height*32;

   BOARD[0].style.width  = boardMinWidth  * sizeMultiplier + "px";
   BOARD[0].style.height = boardMinHeight * sizeMultiplier + "px";

   resizeSync();

   BOARD.resizable({
      handles: "se",
      classes: {"ui-resizable-handle": "ui-icon ui-icon-grip-diagonal-se"},

      aspectRatio: boardMinWidth/boardMinHeight,

      minHeight: boardMinHeight,
      minWidth:  boardMinWidth,
      maxHeight: boardMinHeight*2,
      maxWidth:  boardMinWidth*2,

      resize: resizeSync,
   });
};
function resizeSync()
{
   let setCSSvar = (name, value) => document.documentElement.style.setProperty(`--${name}`, value);


   let BOARDWidth = BOARD[0].style.width;
   let BOARDHeight = BOARD[0].style.height;

   setCSSvar("BOARDWidth",  BOARDWidth);
   setCSSvar("BOARDHeight", BOARDHeight);


   let TDMinSize = Math.min(BOARDWidth.slice(0, -2) / minefield.width, BOARDHeight.slice(0, -2) / minefield.height);

   setCSSvar("TDfontSize", (TDMinSize*25)**0.5 + "px");
};


function updateTime()
{
   let pad = (n) => (n < 10 ? "0" + n : n);

   let newTime = secsToday() - time.beg;

   let mm = Math.trunc(newTime % 3600 / 60);
   let ss = Math.trunc(newTime % 3600 % 60);

   TIME.innerText = `${pad(mm)}:${pad(ss)}`;
};
function secsToday()
{
   let datenow = new Date();

   let hh = datenow.getHours();
   let mm = datenow.getMinutes();
   let ss = datenow.getSeconds();
   let ms = datenow.getMilliseconds();

   return hh*60*60 + mm*60 + ss + ms/1000;
};


function animate(el, name, seconds=1, {mode="ease-in-out", repetitions=1, reset=true, callback=null} = {})
{
   if (reset && el.style.animationName === name)
   {
      el.style.animation = "none";
      el.offsetHeight;
      el.style.animation = "none";
   }

   el.style.animation = `${name} ${seconds}s ${mode} ${repetitions}`;

   el.addEventListener("animationend", function()
   {
      el.style.animation = "none";
      callback?.();
   }, {once: true});
};

function debug(text, id="debugText")
{
   text = JSON.stringify(text);

   if (id === true || document.getElementById(id) === null)
   {
      let debugtxt = document.createElement("p");
      debugtxt.id = id;
      debugtxt.innerText = text;
      debugtxt.style.fontSize = "20px";
      document.body.appendChild(debugtxt);
   }

   else document.getElementById(id).innerText = text;
};
function perf(fun, log=true)
{
   let RES;
   const BEG = performance.now();

   RES = fun?.();

   const END = performance.now();

   if (log) console.log(`perf: ${END-BEG}\nresult: ${JSON.stringify(RES)}`);

   return END - BEG;
};