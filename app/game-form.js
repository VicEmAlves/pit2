// game-form.js
document.addEventListener('DOMContentLoaded', init);
let complexities = [];

async function init(){
  const userId = requireAuth(); if(!userId) return;
  document.getElementById('btn-cancel').addEventListener('click', ()=> history.back());
  document.getElementById('btn-save').addEventListener('click', onSave);

  await loadComplexities();

  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  if(id){
    document.getElementById('title').textContent = 'Atualizar Jogo';
    await loadAndFill(id, userId);
  }
}

async function loadComplexities(){
  const sel = document.getElementById('g-complex');
  sel.innerHTML = '<option>Carregando...</option>';
  try{
    const res = await fetchJson(apiUrl('/api/Game/complexidades'));
    if(!res.ok){ sel.innerHTML = '<option>Erro</option>'; return; }
    const list = await res.json();
    sel.innerHTML = '';
    list.forEach(c=>{
      const id = c.id ?? c.Id;
      const desc = c.descricao ?? c.Descricao;
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = desc;
      sel.appendChild(opt);
    });
  }catch{
    sel.innerHTML = '<option>Erro</option>';
  }
}

async function loadAndFill(gameId, userId){
  // fetch all user's games and find the one
  try{
    const res = await fetchJson(apiUrl(`/api/Game/user/${userId}/games`));
    if(!res.ok){ document.getElementById('form-message').textContent = 'Erro ao carregar jogo.'; return; }
    const list = await res.json();
    const g = list.find(x => (x.id ?? x.Id) === gameId || String((x.id ?? x.Id)).toLowerCase() === gameId.toLowerCase());
    if(!g){ document.getElementById('form-message').textContent = 'Jogo não encontrado.'; return; }
    // fill
    document.getElementById('g-nome').value = g.nome ?? g.Nome;
    document.getElementById('g-duracao').value = g.duracaoMinutos ?? g.DuracaoMinutos;
    document.getElementById('g-qtd-min').value = g.qtdMinimaJogadores ?? g.QtdMinimaJogadores;
    document.getElementById('g-qtd-max').value = g.qtdMaximaJogadores ?? g.QtdMaximaJogadores;
    document.getElementById('g-idade').value = g.idadeMinima ?? g.IdadeMinima;
    document.getElementById('g-complex').value = (g.idComplexidade ?? g.IdComplexidade);
    // store id
    document.body.dataset.editId = g.id ?? g.Id;
  }catch{
    document.getElementById('form-message').textContent = 'Erro de rede.';
  }
}

async function onSave(){
  const userId = requireAuth(); if(!userId) return;
  const nome = (document.getElementById('g-nome').value || '').trim();
  const dur = parseInt(document.getElementById('g-duracao').value || '');
  const qmin = parseInt(document.getElementById('g-qtd-min').value || '');
  const qmax = parseInt(document.getElementById('g-qtd-max').value || '');
  const idade = parseInt(document.getElementById('g-idade').value || '');
  const complex = parseInt(document.getElementById('g-complex').value || '');

  const msg = document.getElementById('form-message'); msg.textContent = '';

  if(!nome || isNaN(dur) || isNaN(qmin) || isNaN(qmax) || isNaN(idade) || isNaN(complex)){
    msg.textContent = 'Todos os campos são obrigatórios.';
    return;
  }

  const payload = {
    IdUsuario: userId,
    IdComplexidade: complex,
    Nome: nome,
    DuracaoMinutos: dur,
    QtdMinimaJogadores: qmin,
    QtdMaximaJogadores: qmax,
    IdadeMinima: idade
  };

  const editId = document.body.dataset.editId;
  try{
    if(editId){
      payload.Id = editId;
      const res = await fetchJson(apiUrl('/api/Game/update'), {
        method: 'PUT', body: JSON.stringify(payload)
      });
      if(res.ok){ location.href = 'dashboard.html'; return; }
      if(res.status === 404){ msg.textContent = 'Jogo não encontrado.'; return; }
      const e = await res.text(); msg.textContent = e || 'Falha ao atualizar.';
    }else{
      const res = await fetchJson(apiUrl('/api/Game/create'), { method: 'POST', body: JSON.stringify(payload) });
      if(res.status === 201){ location.href = 'dashboard.html'; return; }
      const e = await res.text(); msg.textContent = e || 'Falha ao criar.';
    }
  }catch{
    msg.textContent = 'Erro de rede.';
  }
}