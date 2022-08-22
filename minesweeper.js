/**
 * An Object containing:
 * @property {Number}  width         - The minefield width
 * @property {Number}  height        - The minefield height
 * @property {Number}  cells         - The minefield total cells number
 * @property {Number}  mines         - The minefield total mines number
 * @property {Object}  [X]           - Each minefield cell on its index ([0]..[99]+)
 * @property {Boolean} [X].isOpen    - Whether a cell is revealed
 * @property {Boolean} [X].isMine    - Whether a cell is a mine
 * @property {Boolean} [X].isFlagged - Whether a cell is flagged
 * @property {Number}  [X].mines     - Number of mines present around a cell
 */
export default class Minefield
{
   /**
    * Creates a new minefield with the given width, height and mines number (and randomizes them)
    * @param {Number} width The width of the minefield
    * @param {Number} height The height of the minefield
    * @param {Number} mines The number of total mines (default: width*height/5). If array given, the values of the array will be the indexes where the mines will be placed
    * @param {Function} randomizer A function that returns a random decimal number between 0 and 1 (default: {@link Math.random})
    * @returns {Minefield} A new Minefield object
    * @throws {Error} If parameters are invalid
    */
   constructor(width, height, mines = Math.floor(width*height/5), randomizer = Math.random)
   {
      function minefieldGetNearbyCells(minefield, cell)
      {
         cell = validateNumber(cell, 0, minefield.cells-1);
         
         let nearbyCells = [cell];
   
         let x = cell % minefield.width;
         let y = Math.floor(cell / minefield.width);
   
         let isNotFirstRow = y > 0;
         let isNotLastRow = y < minefield.height-1;
   

         if (isNotFirstRow) nearbyCells.push(cell-minefield.width);      //up
         if (isNotLastRow ) nearbyCells.push(cell+minefield.width);      //down
   
         if (x > 0) //if cell isn't on first column
         {
            nearbyCells.push(cell-1);                                    //left
   
            if (isNotFirstRow) nearbyCells.push(cell-minefield.width-1); //up left
            if (isNotLastRow ) nearbyCells.push(cell+minefield.width-1); //down left
         }
   
         if (x < minefield.width-1) //if cell isn't on last column
         {
            nearbyCells.push(cell+1);                                    //right
            
            if (isNotFirstRow) nearbyCells.push(cell-minefield.width+1); //up right
            if (isNotLastRow ) nearbyCells.push(cell+minefield.width+1); //down right
         }
   
         return nearbyCells;
      }

      width = validateNumber(width, 0), height = validateNumber(height, 0);

      let cells = width*height;

      if (Array.isArray(mines))
      {
         //assign properties to minefield
         Object.assign(this, {width: width, height: height, cells: cells, mines: mines.length});
         
         //assign properties to cells and add mines
         for (let i=0; i<cells; i++)
         {
            this[i] = {mines: 0, isMine: false, isOpen: false, isFlagged: false};
         }
   
         //assign mines to cells and high up the cells' nearby mines number by one
         for (let i=0; i<mines.length; i++)
         {
            this[mines[i]].isMine = true;
            
            let nearbyCells = minefieldGetNearbyCells(this, mines[i]);

            for (let j=0; j<nearbyCells.length; j++)
            {
               this[nearbyCells[j]].mines++;
            }
         }
      }
      else
      {
         mines = validateNumber(mines, 0, cells);

         //assign properties to minefield
         Object.assign(this, {width: width, height: height, cells: cells, mines: mines});
         
         //assign properties to cells and add mines
         for (let i=0; i<cells; i++)
         {
            this[i] = {mines: 0, isMine: i < mines, isOpen: false, isFlagged: false};
         }
   
         //Knuth-Fisher-Yates shuffle algorithm
         for (let i=cells-1; i > 0; i--)
         {
            let j = Math.floor(randomizer() * (i+1));
            [this[i], this[j]] = [this[j], this[i]];
         }

         //high up the cells' nearby mines number by one
         for (let i=0; i<cells; i++)
         {
            if (this[i].isMine)
            {
               let nearbyCells = minefieldGetNearbyCells(this, i);

               for (let j=0; j<nearbyCells.length; j++)
               {
                  this[nearbyCells[j]].mines++;
               }
            }
         }
      }

      return this;
   }


   /**
    * Converts the Minefield object to a Minefield2D object.
    * 
    * WARNING! The two objects will share the same reference to the same cells so any changes made to one will be reflected in the other
    * @returns {Minefield2D} A Minefield2D object
    */
   toMinefield2D()
   {
      let minefield2D = new Minefield2D(this.width, this.height)

      for (let i=0; i<this.width; i++)
      {
         for (let j=0; j<this.height; j++)
         {
            delete minefield2D[i][j];
            minefield2D[i][j] = this[i+j*this.width];
         }
      }

      return minefield2D;
   }


   /**
    * Opens a given cell and may open nearby ones following the minesweeper game rules.
    * 
    * Can also give the index of an already open cell that matches its nearby mines number with its nearby flags to automatically open all of its nearby not-flagged cells 
    * @param {Number} cell The index of the cell to open
    * @param {Boolean} firstclick If true, and a bomb is opened, it will be moved in another cell starting from 0 (default: {@link isNew()})
    * @returns {Array.<number>} An array containing the indexes of the updated cells
    * @throws {Error} If parameters are invalid
    */
   openCell(cell, firstclick=this.isNew())
   {
      cell = validateNumber(cell, 0, this.cells-1);

      let updatedCells = [];

      let openIfEmptyZone = (cell) =>
      {
         let emptyZone = this.getEmptyZone(cell);

         for (let i=0; i<emptyZone.length; i++)
         {
            this[emptyZone[i]].isOpen = true;
            updatedCells.push(emptyZone[i]);
         }
      };

      if (this[cell].isOpen == false)
      {
         this[cell].isOpen = true;
         updatedCells.push(cell);

         if (this[cell].isMine)
         {
            if (firstclick)
            {
               this[cell].isMine = false;

               for (let i=0; i < this.cells; i++)
               {
                  if (this[i].isMine == false && i != cell)
                  {
                     this[i].isMine = true;
                     break;
                  }
               }
   
               this.resetMines();
   
               openIfEmptyZone(cell);
            }
         }

         else openIfEmptyZone(cell);
      }
      else if (this[cell].mines != 0)
      {
         let nearbyCells = this.getNearbyCells(cell);
         let flagCount = 0;

         for (let i=0; i<nearbyCells.length; i++)
         {
            if (this[nearbyCells[i]].isFlagged)
            {
               flagCount++;
            }
         }
         
         if (flagCount == this[cell].mines)
         {
            for (let i=0; i<nearbyCells.length; i++)
            {
               if (this[nearbyCells[i]].isFlagged == false && this[nearbyCells[i]].isOpen == false)
               {
                  this[nearbyCells[i]].isOpen = true;
                  updatedCells.push(nearbyCells[i]);

                  if (this[nearbyCells[i]].isMine == false)
                  {
                     openIfEmptyZone(nearbyCells[i]);
                  }
               }
            }
         }
      }

      return updatedCells;
   }

   /**
    * Checks if a minefield is solvable from a given cell (by not guessing)
    * 
    * WARNING! This method gets resource-intensive the more the minefield is big.
    * @param {Number} cell The index of the cell where to start
    * @param {Boolean} restore If true, the Minefield will be restored after the function ends (default: true)
    * @returns {Boolean} A Boolean value that indicates whether the minefield is solvable from the given cell
    * @throws {Error} If parameters are invalid
    */
   isSolvableFrom(cell, restore=true)
   { 
      cell = validateNumber(cell, 0, this.cells-1);

      let matrixIncludesArr = (matrix, arr) => JSON.stringify(matrix).includes(JSON.stringify(arr));

      let firstClick = this.openCell(cell)
      if (firstClick.length <= 1 && this[firstClick[0]].mines != 0)
      {
         if (restore) this[firstClick[0]].isOpen = false;
         return false;
      }

      let updates = true;
      
      while (updates)
      {
         let phantomGroups = [];
         updates = false;

         let importantCells = [];

         for (let i=0; i<this.cells; i++)
         {
            if (this[i].isOpen == false && this[i].isFlagged == false)
            {
               let nearbyCells = this.getNearbyCells(i);
               
               for (let j=0; j<nearbyCells.length; j++)
               {
                  if (this[nearbyCells[j]].isOpen == true)
                  {
                     importantCells.push(nearbyCells[j]);
                  }
               }
            }
         }

         importantCells = [...new Set(importantCells)];

         
         for (let i of importantCells) //1st try: open cells using flags
         {
            if (this[i].mines == 0) //all nearby cells are fine
            {
               let emptyCells = this.getEmptyZone(i);

               for (let j=0; j<emptyCells.length; j++)
               {
                  if (this[emptyCells[j]].isOpen == false)
                  {
                     this[emptyCells[j]].isOpen = true;
                     updates = true;
                  }
               }
            }
            else
            {
               let nearbyCells = this.getNearbyCells(i);
      
               let closedCells = 0, flaggedCells = 0, unflaggedCells = [];
      
               for (let j=0; j<nearbyCells.length; j++)
               {
                  if (this[nearbyCells[j]].isOpen == false)
                  {
                     closedCells++;

                     if (this[nearbyCells[j]].isFlagged) flaggedCells++;
                     else unflaggedCells.push(nearbyCells[j]);
                  }
               }
      
               if (unflaggedCells.length > 0)
               {
                  if (this[i].mines == flaggedCells) //all nearby cells are fine (except for the flagged cells) > open them
                  {
                     unflaggedCells.forEach(x => this[x].isOpen = true);
                     updates = true
                  }
      
                  if (this[i].mines == closedCells) //all nearby closed cells are mines > flag them all
                  {
                     unflaggedCells.forEach(x => this[x].isFlagged = true);
                     updates = true;
                  }
      
                  if (this[i].mines > flaggedCells) //all nearby not flagged cells have some mines > phantom flagging
                  {
                     let tempPhantomGroup = [this[i].mines - flaggedCells, ...unflaggedCells.sort((a, b) => a - b)];
                     
                     if (matrixIncludesArr(phantomGroups, tempPhantomGroup) == false) phantomGroups.push(tempPhantomGroup);
                  }
               }
            }
         }

         if (updates == false) //2nd try: open cells using phantom bombs
         {
            let shiftUpdates = true;

            while (shiftUpdates) //shifting & adding phantom bombs
            {
               shiftUpdates = false;

               for (let i of importantCells)
               {
                  let nearbyCells = this.getNearbyCells(i);
                  let phantomGroupSum = [0];
                  
                  let closedCells = [];
                  let flaggedCells = 0;

                  for (let k=0; k < nearbyCells.length; k++)
                  {
                     if (this[nearbyCells[k]].isFlagged) flaggedCells++;
                     else if (this[nearbyCells[k]].isOpen == false) closedCells.push(nearbyCells[k]);
                  }
                  
                  for (let j=0; j < phantomGroups.length; j++)
                  {
                     if (phantomGroups[j].slice(1).every(x => closedCells.includes(x)) && closedCells.length != phantomGroups[j].length-1)
                     {
                        let shift = closedCells.filter(x => phantomGroups[j].includes(x, 1) == false).sort((a, b) => a - b);
                        let shiftMines = this[i].mines - phantomGroups[j][0] - flaggedCells;

                        let shiftPhantomGroup = [shiftMines, ...shift];

                        if (shift.length > 0 && shiftMines > 0 && matrixIncludesArr(phantomGroups, shiftPhantomGroup) == false)
                        {
                           let push = true;

                           for (let k=0; k<phantomGroups.length; k++)
                           {
                              if (phantomGroups[k].every(x => shiftPhantomGroup.includes(x)))
                              {
                                 push = false;
                                 break;
                              }
                           }

                           if (push)
                           {
                              phantomGroups.push(shiftPhantomGroup)
                              shiftUpdates = true;
                           }
                        }

                        if (phantomGroups[j].slice(1).some(x => phantomGroupSum.includes(x, 1)) == false)
                        {
                           phantomGroupSum[0] += phantomGroups[j][0];
                           phantomGroupSum.push(...phantomGroups[j].slice(1));
                        }
                     }
                  }

                  if (phantomGroupSum[0] > 0 && matrixIncludesArr(phantomGroups, phantomGroupSum) == false)
                  {
                     phantomGroups.push(phantomGroupSum);
                     shiftUpdates = true;
                  }
               }
            }


            for (let i of importantCells) //open cells using phantom bombs
            {
               let nearbyCells = this.getNearbyCells(i);

               for (let j=0; j < phantomGroups.length; j++)
               {
                  if (nearbyCells.some(x => phantomGroups[j].includes(x, 1)))
                  {
                     let phantomGroupUncontainedCells = phantomGroups[j].slice(1).filter(x => nearbyCells.includes(x) == false).length;

                     let flaggedCells = 0, unknownCells = [];
   
                     for (let k=0; k < nearbyCells.length; k++)
                     {
                        if (this[nearbyCells[k]].isFlagged) flaggedCells++;
                        else if (this[nearbyCells[k]].isOpen == false && phantomGroups[j].includes(nearbyCells[k], 1) == false)
                        {
                           unknownCells.push(nearbyCells[k]);
                        }
                     }
   
                     if (unknownCells.length > 0)
                     {
                        if (this[i].mines == flaggedCells + phantomGroups[j][0] + unknownCells.length) //all unknown cells are mines > flag them all
                        {
                           unknownCells.forEach(x => this[x].isFlagged = true);
                           updates = true;
                        }
                        if (this[i].mines == flaggedCells + phantomGroups[j][0] - phantomGroupUncontainedCells && updates == false) //all unknown cells are clear > open them
                        {
                           unknownCells.forEach(x =>
                           {
                              if (this[x].isFlagged == false)
                              {
                                 this[x].isOpen = true;
                                 updates = true;
                              }
                           })
                        }
                     }
                  }
               }
            }
         }

         if (updates == false) //3th try: open cells using remaining flags count
         {
            if (this.usedFlags == this.mines)
            {
               for (let i=0; i < this.cells; i++)
               {
                  if (this[i].isOpen == false && this[i].isFlagged == false)
                  {
                     this[i].isOpen = true;
                  }
               }
            }
            else
            {
               phantomGroups.sort((a, b) => a.length - b.length)
               let remainingPhantomGroups = [0];
         
               for (let i=0; i<phantomGroups.length; i++)
               {
                  if (phantomGroups[i].slice(1).some(x => JSON.stringify(remainingPhantomGroups.slice(1)).includes(x)) == false)
                  {
                     remainingPhantomGroups[0] += phantomGroups[i][0];
                     remainingPhantomGroups.push(...phantomGroups[i].slice(1));
                  }
               }
         
               if (remainingPhantomGroups[0] == this.mines - this.usedFlags)
               {
                  for (let i=0; i < this.cells; i++)
                  {
                     if (this[i].isOpen == false && this[i].isFlagged == false && remainingPhantomGroups.includes(i, 1) == false)
                     {
                        this[i].isOpen = true;
                        updates = true;
                     }
                  }
               }
            }
         }
      }
      
      let isSolvable = false;
      if (this.isCleared()) isSolvable = true;

      if (restore)
      {
         for (let i=0; i < this.cells; i++)
         {
            this[i].isOpen = false;
            this[i].isFlagged = false;
         }
      }

      return isSolvable;
   }

   /**
    * Checks the minefield to find hints about its state
    * @param {Boolean} accurateHint If false, the function will return the nearby cells around the hint. If true, it will only return the exact cells to open/flag. (default: false)
    * @param {Boolean} getOneHint If true, the function will only return a single hint (the first one found starting from the top) (default: true)
    * @returns {Array.<any>} An array containing arrays of the indexes of hint cells + a char value at index 0 of each (O/F) indicating if the hint is about opening or flagging cells
    * @example minefield.getHint(false, false) //returns [['O', 6, 7, 8], ['F', 15, 25, 35]]
    */
   getHint(accurateHint=false, getOneHint=true)
   {
      let matrixIncludesArr = (matrix, arr) => JSON.stringify(matrix).includes(JSON.stringify(arr));

      let hintCells = [];
      let accurateHintCells = [];

      let phantomGroups = [];
      let importantCells = [];

      for (let i=0; i<this.cells; i++)
      {
         if (this[i].isOpen == false && this[i].isFlagged == false)
         {
            let nearbyCells = this.getNearbyCells(i);
            
            for (let j=0; j<nearbyCells.length; j++)
            {
               if (this[nearbyCells[j]].isOpen == true)
               {
                  importantCells.push(nearbyCells[j]);
               }
            }
         }
      }

      importantCells = [...new Set(importantCells)];


      for (let i of importantCells) //1st try: using flags
      {
         if (this[i].isOpen)
         {
            if (this[i].mines == 0) //all nearby cells are fine
            {
               let nearbyCells = this.getNearbyCells(i);
               let closedCells = nearbyCells.filter(x => this[x].isOpen == false)

               if (closedCells.length > 0)
               {
                  hintCells.push(["O", ...nearbyCells, i])
                  accurateHintCells.push(["O", ...closedCells]);
               }
            }
            else
            {
               let nearbyCells = this.getNearbyCells(i);
      
               let closedCells = 0, flaggedCells = 0, unflaggedCells = [];
      
               for (let j=0; j<nearbyCells.length; j++)
               {
                  if (this[nearbyCells[j]].isOpen == false)
                  {
                     closedCells++;

                     if (this[nearbyCells[j]].isFlagged) flaggedCells++;
                     else unflaggedCells.push(nearbyCells[j]);
                  }
               }
      
               if (unflaggedCells.length > 0)
               {
                  if (this[i].mines == flaggedCells) //all nearby cells are fine (except for the flagged cells) > open them
                  {
                     hintCells.push(["O", ...nearbyCells, i])
                     accurateHintCells.push(["O", ...unflaggedCells]);
                  }
      
                  if (this[i].mines == closedCells) //all nearby closed cells are mines > flag them all
                  {
                     hintCells.push(["F", ...nearbyCells, i])
                     accurateHintCells.push(["F", ...unflaggedCells]);
                  }
      
                  if (this[i].mines > flaggedCells) //all nearby not flagged cells have some mines > phantom flagging
                  {
                     let tempPhantomGroup = [this[i].mines - flaggedCells, ...unflaggedCells.sort((a, b) => a - b)];
                     
                     if (matrixIncludesArr(phantomGroups, tempPhantomGroup) == false) phantomGroups.push(tempPhantomGroup);
                  }
               }
            }
         }
      }

      let shiftUpdates = true;
      while (shiftUpdates) //phantom bombs shifting
      {
         shiftUpdates = false;

         for (let i of importantCells)
         {
            let nearbyCells = this.getNearbyCells(i);
            let phantomGroupSum = [0];
            
            let closedCells = [];
            let flaggedCells = 0;

            for (let k=0; k < nearbyCells.length; k++)
            {
               if (this[nearbyCells[k]].isFlagged) flaggedCells++;
               else if (this[nearbyCells[k]].isOpen == false) closedCells.push(nearbyCells[k]);
            }
            
            for (let j=0; j < phantomGroups.length; j++)
            {
               if (phantomGroups[j].slice(1).every(x => closedCells.includes(x)) && closedCells.length != phantomGroups[j].length-1)
               {
                  let shift = closedCells.filter(x => phantomGroups[j].includes(x, 1) == false).sort((a, b) => a - b);
                  let shiftMines = this[i].mines - phantomGroups[j][0] - flaggedCells;

                  let shiftPhantomGroup = [shiftMines, ...shift];

                  if (shift.length > 0 && shiftMines > 0 && matrixIncludesArr(phantomGroups, shiftPhantomGroup) == false)
                  {
                     let push = true;

                     for (let k=0; k<phantomGroups.length; k++)
                     {
                        if (phantomGroups[k].every(x => shiftPhantomGroup.includes(x)))
                        {
                           push = false;
                           break;
                        }
                     }

                     if (push)
                     {
                        phantomGroups.push(shiftPhantomGroup)
                        shiftUpdates = true;
                     }
                  }

                  if (phantomGroups[j].slice(1).some(x => phantomGroupSum.includes(x, 1)) == false)
                  {
                     phantomGroupSum[0] += phantomGroups[j][0];
                     phantomGroupSum.push(...phantomGroups[j].slice(1));
                  }
               }
            }

            if (phantomGroupSum[0] > 0 && matrixIncludesArr(phantomGroups, phantomGroupSum) == false)
            {
               phantomGroups.push(phantomGroupSum);
               shiftUpdates = true;
            }
         }
      }

      for (let i of importantCells) //2nd try: using phantom bombs
      {
         let nearbyCells = this.getNearbyCells(i);

         for (let j=0; j < phantomGroups.length; j++)
         {
            if (nearbyCells.some(x => phantomGroups[j].includes(x, 1)))
            {
               let phantomGroupUncontainedCells = phantomGroups[j].slice(1).filter(x => nearbyCells.includes(x) == false).length;

               let flaggedCells = 0, unknownCells = [], pgCenterNearbyCells = [];

               for (let k=0; k < nearbyCells.length; k++)
               {
                  let tempNearbyCells = this.getNearbyCells(nearbyCells[k]);

                  if (phantomGroups[j].slice(1).every(x => tempNearbyCells.includes(x)) && this[nearbyCells[k]].isOpen)
                  {
                     pgCenterNearbyCells.push(...tempNearbyCells);
                  }

                  if (this[nearbyCells[k]].isFlagged) flaggedCells++;
                  else if (this[nearbyCells[k]].isOpen == false && phantomGroups[j].includes(nearbyCells[k], 1) == false)
                  {
                     unknownCells.push(nearbyCells[k]);
                  }
               }

               if (unknownCells.length > 0)
               {
                  if (this[i].mines == flaggedCells + phantomGroups[j][0] + unknownCells.length) //all unknown cells are mines > flag them all
                  {
                     hintCells.push(["F", ...new Set([...nearbyCells, ...pgCenterNearbyCells, i])]);
                     accurateHintCells.push(["F", ...unknownCells]);
                  }
                  else if (this[i].mines == flaggedCells + phantomGroups[j][0] - phantomGroupUncontainedCells) //all unknown cells are clear > open them
                  {
                     unknownCells = unknownCells.filter(x => this[x].isFlagged == false);

                     if (unknownCells.length > 0)
                     {
                        hintCells.push(["O", ...new Set([...nearbyCells, ...pgCenterNearbyCells, i])]);
                        accurateHintCells.push(["O", ...unknownCells]);
                     }
                  }
               }
            }
         }
      }

      if (this.usedFlags == this.mines) //3th try: using remaining flags count
      {
         let closedCells = [];

         for (let i=0; i < this.cells; i++)
         {
            if (this[i].isOpen == false && this[i].isFlagged == false)
            {
               closedCells.push(i);
            }
         }

         hintCells.push(["O", ...closedCells]);
         accurateHintCells.push(["O", ...closedCells]);
      }
      else
      {
         phantomGroups.sort((a, b) => a.length - b.length)
         let remainingPhantomGroups = [0];
   
         for (let i=0; i<phantomGroups.length; i++)
         {
            if (phantomGroups[i].slice(1).some(x => JSON.stringify(remainingPhantomGroups.slice(1)).includes(x)) == false)
            {
               remainingPhantomGroups[0] += phantomGroups[i][0];
               remainingPhantomGroups.push(...phantomGroups[i].slice(1));
            }
         }
   
         if (remainingPhantomGroups[0] == this.mines - this.usedFlags)
         {
            let safeCells = [];

            for (let i=0; i < this.cells; i++)
            {
               if (this[i].isOpen == false && this[i].isFlagged == false && remainingPhantomGroups.includes(i, 1) == false)
               {
                  safeCells.push(i);
               }
            }

            hintCells.push(["O", ...safeCells]);
            accurateHintCells.push(["O", ...safeCells]);
         }
      }

      if (getOneHint)
      {
         hintCells = hintCells[0];
         accurateHintCells = accurateHintCells[0];
      }

      return (accurateHint ? accurateHintCells : hintCells) ?? [];
   }


   /**
    * Calculates nearby mines number for each cell and assigns the value*/
   resetMines()
   {
      for (let i=0; i<this.cells; i++) this[i].mines = 0;

      for (let i=0; i<this.cells; i++)
      {
         if (this[i].isMine)
         {
            let nearbyCells = this.getNearbyCells(i, true);

            for (let j=0; j<nearbyCells.length; j++)
            {
               this[nearbyCells[j]].mines++;
            }
         }
      }
   }


   /**
    * @returns {Array.<object>} An Array containing only the cells of the Minefield object
    */
   getCellArray()
   {
      return Object.values(this).slice(0, this.cells);
   }
   /**
    * @param {Number} cell The index of the concerned cell
    * @param {Boolean} includeSelf If true, also include the index of the concerned cell (default: false)
    * @returns {Array.<number>} An Array containing the indexes of the cells directly around the given one
    * @throws {Error} If parameters are invalid
    */
   getNearbyCells(cell, includeSelf=false)
   {
      cell = validateNumber(cell, 0, this.cells-1);
      
      let nearbyCells = [];

      let x = cell % this.width;
      let y = Math.floor(cell / this.width);

      let isNotFirstRow = y > 0;
      let isNotLastRow = y < this.height-1;


      if (includeSelf ) nearbyCells.push(cell)                 //center

      if (isNotFirstRow) nearbyCells.push(cell-this.width);      //up
      if (isNotLastRow ) nearbyCells.push(cell+this.width);      //down

      if (x > 0) //if cell isn't on first column
      {
         nearbyCells.push(cell-1);                              //left

         if (isNotFirstRow) nearbyCells.push(cell-this.width-1); //up left
         if (isNotLastRow ) nearbyCells.push(cell+this.width-1); //down left
      }

      if (x < this.width-1) //if cell isn't on last column
      {
         nearbyCells.push(cell+1);                              //right
         
         if (isNotFirstRow) nearbyCells.push(cell-this.width+1); //up right
         if (isNotLastRow ) nearbyCells.push(cell+this.width+1); //down right
      }

      return nearbyCells;
   }
   /**
    * Uses a flood fill algorithm to find all the cells that have 0 mines nearby
    * @param {Number} cell The index of the concerned cell
    * @param {Boolean} includeFlags If true, the flagged cells will be included in the empty zone (default: false)
    * @returns {Array.<number>} An Array containing the indexes of the empty cells zone starting from the given one
    * @throws {Error} If parameters are invalid
    */
   getEmptyZone(cell, includeFlags=false)
   {
      const widthIndex = this.width;
      const startMines = 0;

      if (this[cell].mines != startMines) return [];

      let fullStack = new Set();
      let topStack = [cell];

      while(topStack.length)
      {
         let curCell = topStack.pop();

         while(curCell >= 0 && this[curCell].mines == startMines)
         {
            curCell -= widthIndex;
         }

         curCell += widthIndex;

         let reachLeft = false;
         let reachRight = false;

         while (curCell < this.cells && this[curCell].mines == startMines)
         {
            fullStack.add(curCell);

            if (curCell % widthIndex > 0)
            {
               if (this[curCell-1].mines == startMines && fullStack.has(curCell-1) == false)
               {
                  if (reachLeft == false)
                  {
                     topStack.push(curCell-1);
                     reachLeft = true;
                  }
               }

               else if (reachLeft) reachLeft = false;
            }

            if (curCell % widthIndex < widthIndex-1)
            {
               if (this[curCell+1].mines == startMines && fullStack.has(curCell+1) == false)
               {
                  if (reachRight == false)
                  {
                     topStack.push(curCell+1);
                     reachRight = true;
                  }
               }
               
               else if (reachRight) reachRight = false;
            }

            curCell += widthIndex;
         }
      }

      let marginStack = new Set();

      if (includeFlags)
      {
         for (let cell of fullStack)
         {
            let nearbyCells = this.getNearbyCells(cell);
   
            for (let j=0; j<nearbyCells.length; j++)
            {
               if (this[nearbyCells[j]].mines != startMines)
               {
                  marginStack.add(nearbyCells[j])
               }
            }
         }
      }
      else
      {
         for (let cell of fullStack)
         {
            if (this[cell].isFlagged) fullStack.delete(cell);
   
            let nearbyCells = this.getNearbyCells(cell);
   
            for (let j=0; j<nearbyCells.length; j++)
            {
               if (this[nearbyCells[j]].mines != startMines && this[nearbyCells[j]].isFlagged == false)
               {
                  marginStack.add(nearbyCells[j])
               }
            }
         }
      }

      return [...fullStack, ...marginStack];
   }


   /**
    * @param {Number} cell The index of the desired cell
    * @returns {Array<Number>} An array that has the x and y cords of the desired cell at index 0 and 1 respectively
    */
   getCellCords(cell)
   {
      cell = validateNumber(cell);

      return [cell % this.width, Math.floor(cell/this.width)];
   }
   /**
    * @param {Number} x The X coordinate of the desired cell
    * @param {Number} y The Y coordinate of the desired cell
    * @returns {Number} A Number that indicates the index of the cell that is in the specified row and column
    */
   getCellIndex(x, y)
   {
      x = validateNumber(x), y = validateNumber(y);

      return x + y*this.width;
   }


   /**
    * @returns {Boolean} a Boolean value that indicates whether the game is new (before the first move)
    */
   isNew()
   {
      for (let i=0; i < this.cells; i++)
      {
         if (this[i].isOpen) return false;
      }

      return true;
   }
   /**
    * @returns {Boolean} a Boolean value that indicates whether the game is going on (after the first move, before game over)
    */
   isGoingOn()
   {
      let foundClosedEmpty = false;
      let foundOpen = false;

      for (let i=0; i < this.cells; i++)
      {
         if (this[i].isOpen && this[i].isMine) return false;

         if (this[i].isOpen) foundOpen = true;
         if (this[i].isOpen == false && this[i].isMine == false) foundClosedEmpty = true;
      }

      return foundOpen && foundClosedEmpty;
   }
   /**
    * @returns {Boolean} a Boolean value that indicates whether the game is over (both cleared or lost)
    */
   isOver()
   {
      let foundClosedEmpty = false;

      for (let i=0; i < this.cells; i++)
      {
         if (this[i].isOpen == false && this[i].isMine == false) foundClosedEmpty = true;
         if (this[i].isOpen && this[i].isMine) return true;
      }

      return foundClosedEmpty == false;
   }
   /**
    * @returns {Boolean} a Boolean value that indicates whether the minefield has been cleared (no mines opened)
    */
   isCleared()
   {
      for (let i=0; i < this.cells; i++)
      {
         if (this[i].isOpen == false && this[i].isMine == false) return false;
         if (this[i].isOpen && this[i].isMine) return false;
      }

      return true;
   }
   /**
    * @returns {Boolean} a Boolean value that indicates whether a mine has been opened in the current minefield
    */
   isLost()
   {
      for (let i=0; i < this.cells; i++)
      {
         if (this[i].isOpen && this[i].isMine) return true;
      }

      return false;
   }


   /**
    * Console logs the minefield in a visual way. Legend:
    * 
    *  - ?: Unknown cells (neither opened or flagged)
    *  - F: Flagged cells
    *  - [N]: An open cell, with its nearby mines number
    *  - X: An open mine
    * 
    * @param {Boolean} allsee If true, every cell will be showed as if they were open (default: false)
    */
   visualDebug(allsee=false)
   {
      let text = "";

      for (let i=0; i < this.cells; i++)
      {
         let cell = "";

         if (this[i].isOpen == false && allsee == false)
         {
            if (this[i].isFlagged) cell += "F";
            else cell += "?";
         }
         else if (this[i].isMine == true) cell += "X";
         else cell += this[i].mines;
         
         if ((i+1) % this.width == 0) text += cell + "\n";
         else text += cell + " ";
      }

      console.log(text);
   }
   

   /**
    * @returns {Number} A Number that indicates the used flags in the current minefield
    */
   get usedFlags()
   {
      let flags = 0;

      for (let i=0; i<this.cells; i++)
      {
         if (this[i].isFlagged) flags++;
      }

      return flags;
   }
};

/**
 * An Object containing:
 * @property {Number}  width         - The minefield width
 * @property {Number}  height        - The minefield height
 * @property {Number}  cells         - The minefield total cells number
 * @property {Number}  mines         - The minefield total mines number
 * @property {Object}  [X][Y]           - Each minefield cell on its coordinates
 * @property {Boolean} [X][Y].isOpen    - Whether a cell is revealed
 * @property {Boolean} [X][Y].isMine    - Whether a cell is a mine
 * @property {Boolean} [X][Y].isFlagged - Whether a cell is flagged
 * @property {Number}  [X][Y].mines     - Number of mines present around a cell
 */
class Minefield2D extends Minefield
{
   constructor(width, height, mines = Math.floor(width*height/5), randomizer = Math.random)
   {
      super(width, height, mines, randomizer);

      let minefield2D = [];

      for (let i=0; i<width; i++)
      {
         minefield2D.push([]);

         for (let j=0; j<height; j++)
         {
            minefield2D[i][j] = this[i+j*width];
         }
      }

      for (let i=0; i<this.cells; i++) delete this[i];
      Object.assign(this, minefield2D);

      return this;
   }

   
   /**
    * Converts the Minefield2D object to a Minefield object.
    * 
    * WARNING! The two objects will share the same reference to the same cells so any changes made to one will be reflected in the other
    * @returns {Minefield} A Minefield object
    */
   toMinefield()
   {
      let minefield = new Minefield(this.width, this.height);

      for (let i=0; i<this.width; i++)
      {
         for (let j=0; j<this.height; j++)
         {
            delete minefield[i+j*this.width];
            minefield[i+j*this.width] = this[i][j];
         }
      }

      return minefield;
   }


   /**
    *  - Opens a given cell and may open nearby ones following the minesweeper game rules.
    *  - Can also give the coordinates of an already open cell that matches its nearby mines number with its nearby flags to automatically open all of its nearby not-flagged cells 
    * @param {Number} x The X coordinate of the cell to open
    * @param {Number} y The Y coordinate of the cell to open
    * @param {Boolean} firstclick If true, and a bomb is opened, it will be moved in another cell starting from 0 (default: {@link isNew()})
    * @returns {Array.<Array.<number>>} An array containing arrays with the coordinates of the updated cells
    * @throws {Error} If parameters are invalid
    */
   openCell(x, y, firstclick=this.isNew())
   {
      x = validateNumber(x, 0, this.width-1), y = validateNumber(y, 0, this.height-1);

      let minefield = this.toMinefield();
      let cell = minefield.getCellIndex(x, y)

      let res = minefield.openCell(cell, firstclick);

      let res2D = [];

      for (let i=0; i<res.length; i++)
      {
         res2D.push(minefield.getCellCords(res[i]));
      }

      return res2D;
   }

   /**
    * Checks if a minefield is solvable from a given cell (by not guessing)
    * 
    * WARNING! This method gets resource-intensive the more the minefield is big.
    * @param {Number} x The X coordinate of the cell where to start
    * @param {Number} y The Y coordinate of the cell where to start
    * @param {Boolean} restore If true, the Minefield will be restored after the function ends (default: true)
    * @returns {Boolean} A Boolean value that indicates whether the minefield is solvable from the given cell
    * @throws {Error} If parameters are invalid
    */
   isSolvableFrom(x, y, restore=true)
   {
      x = validateNumber(x, 0, this.width-1), y = validateNumber(y, 0, this.height-1);
      
      let minefield = this.toMinefield();
      let cell = minefield.getCellIndex(x, y)

      return minefield.isSolvableFrom(cell, restore);
   }

   /**
    * Checks the minefield to find hints about its state
    * @param {Boolean} accurateHint If false, the function will return the nearby cells around the hint. If true, it will only return the exact cells to open/flag. (default: false)
    * @param {Boolean} getOneHint If true, the function will only return a single hint (the first one found starting from the top) (default: true)
    * @returns {Array.<any>} An array containing arrays with the coordinates of hint cells + a char value at index 0 of each (O/F) indicating if the hint is about opening or flagging cells
    * @example minefield.getHint(true, false) //returns [['O', [2, 3], [2, 4]], ['F', [6, 5], [7, 5]]]
    * minefield.getHint(true, true) //returns ['O', [2, 3], [2, 4]]
    */
   getHint(accurateHint=false, getOneHint=true)
   {
      let minefield = this.toMinefield();

      let res = minefield.getHint(accurateHint, getOneHint);

      if (res.length == 0) return [];
      if (getOneHint) res = [res];
      

      let res2D = [];

      for (let i=0; i<res.length; i++)
      {
         res2D.push([res[0][0]]);

         for (let j=1; j<res[i].length; j++)
         {
            res2D[i].push(minefield.getCellCords(res[i]));
         }
      }

      return res2D;
   }


   /**
    * Calculates nearby mines number for each cell and assigns the value*/
   resetMines()
   {
      for (let i=0; i<this.width; i++)
      {
         for (let j=0; j<this.height; j++)
         {
            this[i][j].mines = 0;
         }
      }

      for (let i=0; i<this.width; i++)
      {
         for (let j=0; j<this.height; j++)
         {
            if (this[i][j].isMine)
            {
               let nearbyCells = this.getNearbyCells(i, j, true);
   
               for (let k=0; k<nearbyCells.length; k++)
               {
                  this[nearbyCells[k][0]][nearbyCells[k][1]].mines++;
               }
            }
         }
      }
   }


   /**
    * @returns {Array.<object>} An Array containing only the cells of the Minefield object
    */
   getCellArray()
   {
      let cellArray = [];

      for (let i=0; i<this.width; i++)
      {
         for (let j=0; j<this.height; j++)
         {
            cellArray.push(this[i][j]);
         }
      }

      return cellArray;
   }
   /**
    * @param {Number} x The X coordinate of the concerned cell
    * @param {Number} y The Y coordinate of the concerned cell
    * @param {Boolean} includeSelf If true, also include the coordinates of the concerned cell (default: false)
    * @returns {Array.<Array.<number>>} An Array containing arrays with the coordinates of of the cells directly around the given one
    * @throws {Error} If parameters are invalid
    */
   getNearbyCells(x, y, includeSelf=false)
   {
      x = validateNumber(x, 0, this.width-1), y = validateNumber(y, 0, this.height-1);
      
      let nearbyCells = [];

      let isNotFirstRow = y > 0;
      let isNotLastRow = y < this.height-1;


      if (includeSelf ) nearbyCells.push([x, y])      //center

      if (isNotFirstRow) nearbyCells.push([x, y-1]);  //up
      if (isNotLastRow ) nearbyCells.push([x, y+1]);  //down

      if (x > 0) //if cell isn't on first column
      {
         nearbyCells.push([x-1, y]);                //left

         if (isNotFirstRow) nearbyCells.push([x-1, y-1]); //up left
         if (isNotLastRow ) nearbyCells.push([x-1, y+1]); //down left
      }

      if (x < this.width-1) //if cell isn't on last column
      {
         nearbyCells.push([x+1, y]);                //right
         
         if (isNotFirstRow) nearbyCells.push([x+1, y-1]); //up right
         if (isNotLastRow ) nearbyCells.push([x+1, y+1]); //down right
      }

      return nearbyCells;
   }
   /**
    * Uses a flood fill algorithm to find all the cells that have 0 mines nearby
    * @param {Number} x The X coordinate of the concerned cell
    * @param {Number} y The Y coordinate of the concerned cell
    * @param {Boolean} includeFlags If true, the flagged cells will be included in the empty zone (default: false)
    * @returns {Array.<Array.<number>>} An Array containing arrays with the coordinates of the empty cells zone starting from the given one
    * @throws {Error} If parameters are invalid
    */
   getEmptyZone(x, y, includeFlags=false)
   {
      let minefield = this.toMinefield();

      let cell = minefield.getCellIndex(x, y)

      let res = minefield.getEmptyZone(cell, includeFlags);


      let res2D = [];

      for (let i=0; i<res.length; i++)
      {
         res2D.push(minefield.getCellCords(res[i]));
      }

      return res2D;
   }
   

   /**
    * @returns {Boolean} a Boolean value that indicates whether the game is new (before the first move)
    */
   isNew()
   {
      for (let i=0; i < this.width; i++)
      {
         for (let j=0; j < this.height; j++)
         {
            if (this[i][j].isOpen) return false;
         }
      }

      return true;
   }
   /**
    * @returns {Boolean} a Boolean value that indicates whether the game is going on (after the first move, before game over)
    */
   isGoingOn()
   {
      let foundClosedEmpty = false;
      let foundOpen = false;

      for (let i=0; i < this.width; i++)
      {
         for (let j=0; j < this.height; j++)
         {
            if (this[i][j].isOpen && this[i][j].isMine) return false;

            if (this[i][j].isOpen) foundOpen = true;
            if (this[i][j].isOpen == false && this[i][j].isMine == false) foundClosedEmpty = true;
         }
      }

      return foundOpen && foundClosedEmpty;
   }
   /**
    * @returns {Boolean} a Boolean value that indicates whether the game is over (both cleared or lost)
    */
   isOver()
   {
      let foundClosedEmpty = false;

      for (let i=0; i < this.width; i++)
      {
         for (let j=0; j < this.height; j++)
         {
            if (this[i][j].isOpen == false && this[i][j].isMine == false) foundClosedEmpty = true;
            if (this[i][j].isOpen && this[i][j].isMine) return true;
         }
      }

      return foundClosedEmpty == false;
   }
   /**
    * @returns {Boolean} a Boolean value that indicates whether the minefield has been cleared (no mines opened)
    */
   isCleared()
   {
      for (let i=0; i < this.width; i++)
      {
         for (let j=0; j < this.height; j++)
         {
            if (this[i][j].isOpen == false && this[i][j].isMine == false) return false;
            if (this[i][j].isOpen && this[i][j].isMine) return false;
         }
      }

      return true;
   }
   /**
    * @returns {Boolean} a Boolean value that indicates whether a mine has been opened in the current minefield
    */
   isLost()
   {
      for (let i=0; i < this.width; i++)
      {
         for (let j=0; j < this.height; j++)
         {
            if (this[i][j].isOpen && this[i][j].isMine) return true;
         }
      }

      return false;
   }


   /**
    * Console logs the minefield in a visual way. Legend:
    * 
    *  - ?: Unknown cells (neither opened or flagged)
    *  - F: Flagged cells
    *  - [N]: An open cell, with its nearby mines number
    *  - X: An open mine
    * 
    * @param {Boolean} allsee If true, every cell will be showed as if they were open (default: false)
    */
   visualDebug(allsee=false)
   {
      this.toMinefield().visualDebug(allsee);
   }


   /**
    * @returns {Number} A Number that indicates the used flags in the current minefield
    */
   get usedFlags()
   {
      let flags = 0;

      for (let i=0; i < this.width; i++)
      {
         for (let j=0; j < this.height; j++)
         {
            if (this[i][j].isFlagged) flags++;
         }
      }

      return flags;
   }
}

function validateNumber(num, min=-Infinity, max=Infinity)
{
   try
   {
      num = Math.trunc(min >= 0 ? Math.abs(+num) : +num);
      if (isNaN(num)) throw new Error();
   }
   catch {throw new Error("Invalid parameter type");}
   
   if (num < min) throw new Error("Parameter value is too small");
   if (num > max) throw new Error("Parameter value is too big");

   return num;
};