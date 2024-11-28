//OMain stuffs requests and move commands under the door.

function ASSERT(cond:boolean){if(!cond){console.log("!Assert failed!");}}

let oWorker=new Worker('oworker.js');
oWorker.onerror = (e:ErrorEvent)=>{
  console.log(e);
};

function byId(str:string)
{
  return document.getElementById(str);
}

interface oMsg
{
  type:string,
  percent:number,
  playerToMove:number,
  board:number[],
  bW:number,
  bH:number
}


class OUI
{
  static playr:number=0;
  static board:number[]=[];
  static bW:number=0;
  static bH:number=0;
  static cmdLine:HTMLInputElement=null;
  static playerLine:HTMLParagraphElement=null
  static boardCanv:HTMLCanvasElement=null;
  static gridCanv:HTMLCanvasElement=null;
  static PTMPara:HTMLParagraphElement=null;
  //static gameOverQ:boolean=false;

  static newGame()
  {
    oWorker.postMessage({cmd:"NewGame", x:0, y:0});//send oCommand
    //OUI.
  }

  static getPossMoves()
  {
    oWorker.postMessage({cmd:"PossMoves", x:0, y:0});
  }

  static calcMove()
  {
    oWorker.postMessage({cmd:"MakeAutoMove", x:0, y:0});
  }
  static makeMove(x:number, y:number)
  {
    oWorker.postMessage({cmd:"MakeMove", x:x,y:y});
  }

  static back2()
  {
    oWorker.postMessage({cmd:"Back2", x:0, y:0});
  }

  static getPiece(x:number, y:number)
  {
    let mask=3<<(2*(x+1));
    return (OUI.board[y]&mask)>>(2*(x+1));
  }

  static updateUI()
  {
    let ctx=this.boardCanv.getContext('2d');
    ctx.clearRect(0, 0, this.boardCanv.width, this.boardCanv.height);
    let cellSz=this.boardCanv.height/OUI.bH;
    ctx.lineWidth=5;
    //let img1=byId("img1") as HTMLImageElement;
    //let img2=byId("img2") as HTMLImageElement;
    //let img3=byId("img3") as HTMLImageElement;
    for(let y=0; y<OUI.bH; y++)
    {
      for(let x=0; x<OUI.bW; x++)
      {

        if(this.getPiece(x,y)!==0)
        {
          ctx.beginPath();

          ctx.arc((x+0.5)*cellSz, (y+0.5)*cellSz, 0.4*cellSz, 0, 2*Math.PI);
          ctx.strokeStyle="#000000";

          ctx.fillStyle=(this.getPiece(x, y)===1?"#000000":"#ffffff");


          ctx.fill();
          ctx.stroke(); //stoke later to preserve lineWidth
        }
      }
    }
    ctx.stroke();
    //Draw grid lines
    ctx.lineWidth=1;
    //ctx.clearRect(0, 0, OUI.boardCanv.width, OUI.boardCanv.height);
    ctx.beginPath();
    for(let i=0; i<OUI.bW+1; i++)
    {
      ctx.moveTo(0, i*cellSz);
      ctx.lineTo(OUI.boardCanv.width, i*cellSz);
      // vertical
      ctx.moveTo(i*cellSz, 0);
      ctx.lineTo(i*cellSz, OUI.boardCanv.height);
    }
    ctx.stroke();
    // OUI.drawGridLines();
    //return out;
  }//does DbgBoard on canvas

  // static drawGridLines()
  // {
  //   let ctx=OUI.boardCanv.getContext("2d");


  // }

  static dbgBoard()
  {
    let out:string[]=[];
    //disp curr player
    out.push(OUI.playr===1?"X":(OUI.playr===2?"O":"Player error"));
    for(let y=0; y<OUI.bH; y++)
    {
      let currRow="";
      for(let x=0; x<OUI.bW; x++)
      {
        currRow+=OUI.getPiece(x, y)===1?"X":(OUI.getPiece(x, y)===2?"O":" ");
      }
      out.push(currRow);

    }
    console.log(out);
    return out;
  }//dbgBoard (omain)

  static OnBoardClick(e:MouseEvent)
  {
    if (e.target instanceof HTMLCanvasElement &&
        e.target===OUI.boardCanv)
    {
      let pxlScl = window.devicePixelRatio;
      let bdr = e.target.getBoundingClientRect();
      let cLeft = bdr.left;
      let cTop  = bdr.top+document.body.scrollTop;

      const w = OUI.boardCanv.width;
      const h = OUI.boardCanv.height;
      const r = (Math.min(w, h)/2-2);  // half size of big board
      const bd_t = h/2-r;
      const bd_l = w/2-r;
      const bigCellSz = ((r*2)/OUI.bW)*pxlScl;// if posX needs to be multiplied by pxlScl, so does posX
      const bcm=bigCellSz/20;  // big cell margin

      const posX = (e.pageX - cLeft)*pxlScl - bd_l;
      const posY = (e.pageY - cTop)*pxlScl - bd_t;

      if (posX>=0 && posX<(2*r)*pxlScl &&
          posY>=0 && posY<(2*r)*pxlScl)
      {
        const bigx = Math.floor(posX/bigCellSz);
        const bigy = Math.floor(posY/bigCellSz);
        const bl = bigx*bigCellSz + bcm;
        const bt = bigy*bigCellSz + bcm;
        // const bigIdx = bigy*3+bigx;
        if (OUI.getPiece(bigx, bigy)===0) {
            OUI.makeMove(bigx, bigy);
        }
        else {
        }
      }
    } // if (!GameOverQ && PlayerToMove===2)
  } // OnBoardClick()

  static gotWorkerMessage(e:MessageEvent)//recieve oMsg
  {
    let d:oMsg = e.data as oMsg;
    //console.log("Worker msg: "+d.type);
    //console.log(d);
    switch (d.type) {
    case "GameState":
      //console.log(d.board);
      OUI.board=d.board.slice();
      OUI.bH=d.bH;
      OUI.bW=d.bW;
      OUI.playr=d.playerToMove;
      OUI.cmdLine.disabled=false;
      OUI.cmdLine.value="";
      //if(this.gameOverQ){return;}
      OUI.cmdLine.placeholder="";
      OUI.playerLine.innerHTML="Waiting for player "+d.playerToMove+"..."
      // console.log("Placeholder cleared.")
      //console.log("playr:"+OUI.playr);

      OUI.updateUI();
      if(OUI.playr===1){OUI.cmdLine.disabled=false;}
      break;
    case 'progress':
      OUI.cmdLine.disabled=true;
      OUI.cmdLine.placeholder=d.percent.toString();
      // console.log("Placeholder changed.")
      break;
    case 'Win':
      switch(d.playerToMove)
      {
        case 1:
          this.playerLine.innerHTML="Player 1 wins!";
          console.log("Player 1 wins!");
          //this.gameOverQ=true;
          break;
        case 2:
           this.playerLine.innerHTML="Player 2 wins!";
           console.log("Player 2 wins!")
          //this.gameOverQ=true;
          break;
        case 0.5:
          this.playerLine.innerHTML="It's a tie!";
          console.log("It's a tie!");
        break;
        default:
      }
      ASSERT(this.cmdLine.placeholder.length>0)
    break;
    case "PassAlert":
      alert("Player "+d.playerToMove+" must pass. Player "+(3-d.playerToMove)+"'s turn.");
    break;
    default:
      console.log("unknown workermessage type:"+d.type);
    } // switch ()
  }



  static PlayerMoveCmd()
  {
    let value=OUI.cmdLine.value;
    let matched=value.match(/(^[0-8]),? *([0-8]$)/);
    if(matched)
    {
      OUI.makeMove(Number(matched[1])-1, Number(matched[2])-1);
    }//in case it doesn't match anything

    console.log(matched);
    OUI.cmdLine.value="";
  }
  static InitPage()
  {
    OUI.cmdLine = byId("cmdline") as HTMLInputElement;
    OUI.boardCanv = byId("board") as HTMLCanvasElement;
    // OUI.gridCanv = byId("grid") as HTMLCanvasElement;
    let button=byId("auto1Btn") as HTMLButtonElement;
    button.onclick=OUI.calcMove;
    button=byId("back2Btn") as HTMLButtonElement;
    button.onclick=OUI.back2;
    button=byId("newGameBtn") as HTMLButtonElement;
    button.onclick=OUI.newGame;
    OUI.playerLine=byId("playerLine") as HTMLParagraphElement;
    OUI.cmdLine.disabled=true;
    OUI.cmdLine.addEventListener('change', OUI.PlayerMoveCmd);

    //oWorker.postMessage({cmd:'NewGame'});
    OUI.resizeCanv();
    OUI.newGame();

  } // C4Main.InitPage()

  static resizeCanv()
  {
    //let canv=document.getElementById("chipCanv") as HTMLCanvasElement;
    let size=Math.min(window.innerWidth, window.innerHeight)*0.9;
    OUI.boardCanv.height=size;
    OUI.boardCanv.width=size;
    OUI.boardCanv.style.height=size+"px";
    OUI.boardCanv.style.width=size+"px";
    // OUI.gridCanv.height=size;
    // OUI.gridCanv.width=size;
    // OUI.gridCanv.style.height=size+"px";
    // OUI.gridCanv.style.width=size+"px";
    OUI.updateUI();
    // OUI.drawGridLines();
  }//ResizeCanv()
}



oWorker.addEventListener("message", (e:MessageEvent)=>{OUI.gotWorkerMessage(e); /*console.log(oWorker)*/});
interface Window { [key: string]: any }
window["InitPage"]=OUI.InitPage;