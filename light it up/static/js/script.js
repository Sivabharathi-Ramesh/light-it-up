const board = document.getElementById('board');
const message = document.getElementById('message');
const bulbAnim = document.getElementById('bulbAnim');

let componentsOnBoard = [];

document.querySelectorAll('.component').forEach(item => {
  item.addEventListener('dragstart', dragStart);
});

board.addEventListener('dragover', dragOver);
board.addEventListener('drop', drop);

function dragStart(e) {
  e.dataTransfer.setData('text', e.target.id);
}

function dragOver(e) {
  e.preventDefault();
}

function drop(e) {
  e.preventDefault();
  const id = e.dataTransfer.getData('text');
  const newElem = document.createElement('div');
  newElem.classList.add('placed');
  newElem.textContent = document.getElementById(id).textContent;
  newElem.style.position = 'absolute';
  newElem.style.left = e.offsetX + 'px';
  newElem.style.top = e.offsetY + 'px';
  newElem.dataset.type = id;
  board.appendChild(newElem);

  componentsOnBoard.push(id);
  checkCircuit();
}

function checkCircuit() {
  if (componentsOnBoard.includes('battery') &&
      componentsOnBoard.includes('bulb') &&
      componentsOnBoard.includes('wire')) {
    message.innerHTML = "✨ The bulb lights up! Great job! 💡";
    bulbAnim.style.display = 'block';
    board.style.background = "#fff176";
  } else {
    message.innerHTML = "Try connecting the components!";
    bulbAnim.style.display = 'none';
    board.style.background = "#e0f7fa";
  }
}
