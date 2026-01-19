document.querySelector('form').addEventListener('submit', e => {
    document.querySelectorAll('button').forEach(btn => btn.classList.add('disabled'));
    document.querySelectorAll('input').forEach(input => input.classList.add('disabled'));
});

function selectAll(parentNode){
    parentNode.querySelectorAll('input[type=checkbox]').forEach(input => input.checked=true);
}

function selectNone(parentNode){
    parentNode.querySelectorAll('input[type=checkbox]').forEach(input => input.checked=false);
}


