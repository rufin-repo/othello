///<reference path='mcts2.ts'/>
///<reference path='othelloState.ts'/>

// import { pseudoRandomBytes } from "crypto";


let AutoPlay=[false, true]

//ctx takes move requests and moves and updates its OthelloState and does MCTS and gives back updated
//board for display in oMain. OMain handles board debug stuff.


const ctx :Worker=self as any;

importScripts('mcts2.js', 'othelloState.js');

interface OCommand
{
  cmd:string,
  x:number,
  y:number
}

let os=new OS;

let gameSolver=new MonteCarloTreeSearch(5000);

ctx.addEventListener('message',gotOUIMessage)

function gotOUIMessage(e: MessageEvent) {


  let data = e.data as OCommand;
  console.log("ctx got ["+ data.cmd + "] cmd.");
  switch (data.cmd) {
  case 'NewGame':
    {
      os.resetGame();

      //5os.MakeMove(gameSolver.FindBestMove(os));
      //console.log(move);
      os.SendGameStateToHost();
      if(AutoPlay[0])
      {
        HandleAutoPlay()
      }
    }
    break;
  case 'PossMoves':
    console.log(os.GetMoves());
    break;
  case 'Back2':
    os.Takeback2();
    break;
  case 'MakeMove':
  case 'MakeAutoMove':
    console.log(os.PlayerToMove);
  //console.log(os.HasMovesQ());
    /////////////////////////////////
    // HANDLE CURRENT MOVE
    ///////////////////////////////////
    if (data.cmd==='MakeAutoMove') {//player wants computer to help
      //console.log("calculating move...");
      let move = gameSolver.FindBestMove(os);
      os.MakeMove(move, true);
      console.log(move);//os.MakeMove(move);
    }
    else if(os.PlayerToMove===1)
    { //player makes own move.
      // console.log("it works here too!");
      os.MakeMove({x:data.x, y:data.y, player:os.PlayerToMove}, true);
    }

    os.SendGameStateToHost();
    HandleAutoPlay()
    //NEXT PLAYER

    //Does current player have moves?

    ///////////////////////////////////////////
    //HANDLE PASSES
    //////////////////////////////////////////

  //   else if(os.PlayerToMove===2 && !AutoPlay2)//player 1 did not move.
  //   {
  //     os.MakeMove({x:data.x, y:data.y, player:2});
  //     os.SendGameStateToHost();
  //     break;
  //   }
  //   if (os.PlayerToMove===2 && os.HasMovesQ() && !AutoPlay2) {//player 2 is person and player 1 just moved.

  //     break; // wait for player 2 to choose a move.

  //   }
  //   else if(os.PlayerToMove===2 && os.HasMovesQ() && AutoPlay2)//player 2 is computer.
  //   {
  //     if(os.GetMoves()[0].x<0){break;}
  //     let move = gameSolver.FindBestMove(os);
  //      os.MakeMove(move);
  //      console.log(move)
  //   }

  //   break;
  // } // switch (data.cmd)


  // if(os.GetMoves()[0] && os.GetMoves()[0].x<0)//next move: must pass (player 2 must pass)
  // {

  //   ctx.postMessage({
  //           type:"PassAlert",
  //           percent:null,
  //           board:null,
  //           playerToMove:os.PlayerToMove,
  //           bW:null,
  //           bH:null
  //           });
  //   os.MakeMove({x:-1, y:-1, player:os.PlayerToMove})//automatically handle next move too.
  //   //if next player is the computer, ask it to compute next move.
  //   if(os.PlayerToMove===2 && os.HasMovesQ() && AutoPlay2){
  //   let move = gameSolver.FindBestMove(os);
  //   os.MakeMove(move);}
  //   //now we have to wait...
  // }


  // os.SendGameStateToHost();

  // function MovePlayer1()
  // {
  //   if(os.HasMovesQ())
  //   {
  //     return // wait for next player.
  //   }
  //   else if(!os.passedOnceQ)
  //   {
  //     os.MakeMove({x:-1, y:-1, player:1}, true);//pass
  //   }
  //   else // already passed. GameResult.
  //   {
  //     os.
  //   }
  //
  }
}

function HandleAutoPlay()
{
  while(AutoPlay[os.PlayerToMove-1] && os.GetMoves().length)
  {
    let move=gameSolver.FindBestMove(os);
    os.MakeMove(move, true);
    if(move.x<0 || move.y<0)
    {
      os.SendGameStateToHost(); // update UI before alerting
      ctx.postMessage({
        type:"PassAlert",
        percent:null,
        board:null,
        playerToMove:os.PlayerToMove,
        bW:null,
        bH:null
        });
    }
    console.log(move);
    os.SendGameStateToHost();
    // Looks ahead to next player - must it pass?
    if(os.GetMoves.length && os.GetMoves()[0].x<0)// must pass
    {
      os.MakeMove({x:-1, y:-1, player: os.PlayerToMove});
      os.SendGameStateToHost(); // sendgameStateToHost checks if a next move is possible.
      ctx.postMessage({
        type:"PassAlert",
        percent:null,
        board:null,
        playerToMove:os.PlayerToMove,
        bW:null,
        bH:null
        });
    }


  }
  if(os.GetMoves().length===0)
  {
    os.SendGameStateToHost();
  }
}