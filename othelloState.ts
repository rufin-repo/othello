//OthelloState needs to be part of worker side because it has MCTS and Gamestate.
///<reference path='oworker.ts'/>

let smallBoard=false;


class OS extends GameState
{
  board:number[];//see paper
  static bH=8
  static bW=8;
  private playr:number=0; // 1 for black 2 for white
  lastState:OS=null;
  passedOnceQ=false;

  get PlayerToMove(){
    return this.playr;
  }

  //   _____         __  __
  //  |_   _| _ _  _|  \/  |_____ _____
  //    | || '_| || | |\/| / _ \ V / -_)
  //    |_||_|  \_, |_|  |_\___/\_/\___|
  //            |__/

  private TryDir(move:Move, dx:number, dy:number, PlaceQ:boolean)
  {
    // console.log("Entered TryDir");
    let eaten=false;
    for(let d=1;; d++)
    {
      let x=move.x+d*dx;
      let y=move.y+d*dy;
      // if(x>=OS.bW || y>=OS.bH || x<0 || y<0){break;}//out of bounds
      let piece=this.getPiece(x, y);
      if(piece===3-this.playr){eaten=true;}//start capturing...
      else if(piece===0){return 0;}//until reach a wall.
      else if(piece===this.playr && !eaten)// reached player's piece, not eaten. Exit.
      {
        return 0; // or founf plater's piece before finding opponent's piece
      }
      else if(piece===this.playr && eaten)
      {
        if(PlaceQ){this.EatDir(move, d, dx, dy);}
        return d;
      }
    }
    return 0;
  }

  private EatDir(move:Move, nSp:number, dx:number, dy:number)
  {
    //eats from current piece to a partner nSp spaces away
    if(nSp<=0){return;}
    for(let d=0;d<nSp; d++)
    {
      let x=move.x+d*dx;
      let y=move.y+d*dy;
      this.setPiece(x, y, this.playr);
    }
  }

  tryMove(move:Move, PlaceQ:boolean)
  {
    // console.log("Entered TryMove");
    let isValidMove=false;
    //0deg
    if(this.TryDir(move, 1, 0, PlaceQ)>0){isValidMove=true;}
    //45deg
    if(this.TryDir(move, 1,-1, PlaceQ)>0){isValidMove=true;}
    // console.log("Here?");
    //90deg
    if(this.TryDir(move, 0,-1, PlaceQ)>0){isValidMove=true;}
    //135deg
    if(this.TryDir(move,-1,-1, PlaceQ)>0){isValidMove=true;}
    //180deg
    // console.log("What happens here")
    if(this.TryDir(move,-1, 0, PlaceQ)>0){isValidMove=true;}
    //225deg
    if(this.TryDir(move,-1, 1, PlaceQ)>0){isValidMove=true;}
    //270deg
    if(this.TryDir(move, 0, 1, PlaceQ)>0){isValidMove=true;}
    //315deg
    if(this.TryDir(move, 1, 1, PlaceQ)>0){isValidMove=true;}
    // console.log(ValidMoveQ);
    return isValidMove;
  }

  isValidMove(move:Move)
  {
    // console.log("Entered IsValidMove");
    if(move){
      if((move.x<0||move.y<0)&& !this.passedOnceQ)
      {
        //this.passedOnceQ=true;
        return true; //passing magic number
      }
      if(this.getPiece(move.x, move.y)===0)// if it's not a pass then is that place empty?
      {
        return this.tryMove(move, false)
      }/// if that spot has not already been placed
    }//if the move is not empty
    return false;
  }//IsValidMove();

  getPiece(x:number, y:number)
  {
    let mask=3<<(2*(x+1));
    return (this.board[y]&mask)>>(2*(x+1));
  }

  setPiece(x:number, y:number, player:number)
  {
    let mask=~(3<<(2*(x+1)));
    this.board[y]&=mask;//clears
    mask=player<<(2*(x+1));
    this.board[y]|=mask;//overwrites
  }

  MakeMove(move:Move, manualInputQ=false) //this is only directly accessed by HandleMove and MCTS
  {
    //record gamestate before it is changed. If the move is invalid then the next time it will be recorded again
    if((move.x<0||move.y<0)&& !this.passedOnceQ)
    {
      this.passedOnceQ=true;
      //console.log("pass");
      this.playr=3-this.playr;
      return true;
      //passed once now
    }
    if(this.playr===1 && manualInputQ)
    {
      //now record gamestate for taking back.
      this.lastState=this.Clone();
    }
    let movedQ=this.tryMove(move, true);
    if(movedQ)
    {
      this.playr=3-this.playr;
    }
  // console.log("Moved?"+movedQ)
    return movedQ;
  }//makeMove()

  Takeback2()
  {
    if(this.lastState)
    {
      this.board=this.lastState.board.slice();
      this.playr=this.lastState.playr;
      this.lastState=this.lastState.lastState;
      this.passedOnceQ=this.lastState.passedOnceQ;
    }
    this.SendGameStateToHost();
  }

  // dbgBoard()
  // {
  //   let out:string[]=[];
  //   //disp curr player
  //   out.push(this.playr===1?"X":(this.playr===2?"O":"Player error"));
  //   for(let y=0; y<OS.bH; y++)
  //   {
  //     let currRow="";
  //     for(let x=0; x<OS.bW; x++)
  //     {
  //       currRow+=this.getPiece(x, y)===1?"X":(this.getPiece(x, y)===2?"O":" ");
  //     }
  //     out.push(currRow);

  //   }
  //   console.log(out);
  //   return out;
  // }//dbgBoard (omain)

  GetMoves()
  {
    // console.log("Entered GetMoves");
    let possMoves:Move[]=[];
    for(let y=0; y<OS.bH; y++)
    {
      for(let x=0; x<OS.bW; x++)
      {
        if(this.getPiece(x,y)!==0)
        {
          continue;
        }
        let move:Move={x:x, y:y, player:this.playr};
        // console.log(move);
        if(this.isValidMove(move))
        {
          possMoves.push(move);
        }

      }
    }
    if(possMoves.length===0 && !this.passedOnceQ)//no poss moves; must pass.
    {
      possMoves.push({x:-1, y:-1, player:this.playr});
    }

    // console.log(possMoves);
    return possMoves;
  }//getMoves()
  MakeARandomMove()
  {
    let moves=this.GetMoves();
    if(this.GetMoves().length===0){return;}
    let chosen=moves[Math.floor(Math.random()*moves.length)];
    this.MakeMove(chosen);
  }

  HasMovesQ()
  {
    return this.GetMoves().length!==0;
  }//HasMovesQ

  countPieces()
  {
    let xcount=0;
    let ocount=0;
    for(let y=0; y<OS.bH; y++)
    {
      for(let x=0; x<OS.bW; x++)
      {
        if(this.getPiece(x,y)===2)
        {
          ocount++;
        }
        else if(this.getPiece(x,y)===1)
        {
          xcount++;
        }
      }
    }
    return {x:xcount, o:ocount}
  }//countPieces()

  GameResult(player:number)
  {
    //console.log(this.countPieces().o);
    if(this.HasMovesQ())
    {
      return null;// still has moves, nobody won.
    }
    else//count which player has more pieces
    {

      if((player===2 && this.countPieces().o>this.countPieces().x) || (player===1 && this.countPieces().x>this.countPieces().o))
      {
        return 1; //player has more pieces
      }
      else if(this.countPieces().x===this.countPieces().o)
      {
        return 0.5; //tie.
      }
      else
      {
        return 0;//lose.
      }
    }
  }//gameResult()

  Clone()
  {
    let n=new OS();
    n.playr=this.playr;
    n.board=this.board.slice();
    n.lastState=this.lastState;
    n.passedOnceQ=this.passedOnceQ;
    return n;
  }

  UpdateProgress(percent:number){this.SendGameStateToHost(percent);}

  SameAs(state:OS)
  {
    return state.playr===this.playr &&
           state.board===this.board;
  }


  resetGame()
  {
    this.board=[];
    for(let i=0; i<OS.bH; i++)
    {
      this.board.push(0);
    }
    if(smallBoard){this.setPiece(1,1,2);
    this.setPiece(2,1,1);}
    else{this.setPiece(4, 4, 2);
    this.setPiece(4, 3, 1);
    this.setPiece(3, 4, 1);
    this.setPiece(3, 3, 2);
    }
    this.playr=1;
    //this.SendGameStateToHost();
    //this.dbgBoard();
  }

  constructor()
  {
    super()
    //this.resetGame();
  }

  SendGameStateToHost(percent:number=null)
  {

    console.log("oWorker sending game state to host.");
//#ifdef WEBWORKER
    //console.log("player:"+this.playr);
    if(percent)
    {
      ctx.postMessage(
        {
          type:"progress",
          percent:percent,
          board:null,
          playerToMove:null,
          bW:null,
          bH:null
        });
    }
    else if(this.GetMoves().length===0)//not even passing is availible.
    {
      switch(os.GameResult(1))
      {
        case 1: ctx.postMessage({
          type:"Win",
          percent:null,
          board:null,
          playerToMove:1,
          bW:null,
          bH:null
        });
        break;
        case 0: ctx.postMessage({
          type:"Win",
          percent:null,
          board:null,
          playerToMove:2,
          bW:null,
          bH:null
        });
        break;
        case 0.5:
          if(!os.HasMovesQ())
          {
            ctx.postMessage({
            type:"Win",
            percent:null,
            board:null,
            playerToMove:0,
            bW:null,
            bH:null
            });
          }

        break;
      }//switch (gameState)
    }
    else{

      ctx.postMessage({
        type: "GameState",
        percent:null,
        board:this.board,
        playerToMove:this.playr,
        bW:OS.bW,
        bH:OS.bH
      });
    }//else
  }//sendGameStateToHost()

}

interface Move
{
  x:number;//0 to boardWidth-1,  -1:pass
  y:number;//0 to boardHeight-1, -1:pass
  player:number;//1 or 2
}