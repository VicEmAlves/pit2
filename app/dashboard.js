// dashboard.js
document.addEventListener('DOMContentLoaded', init);

let complexities = [];

async function init(){
  const userId = requireAuth();
  if(!userId) return;

  document.getElementById('btn-logout').addEventListener('click', ()=>{
    sessionStorage.removeItem('userId');
    window.location.href = 'index.html';
  });

  document.getElementById('btn-search').addEventListener('click', onSearch);
  document.getElementById('btn-clear').addEventListener('click', onClear);
  document.getElementById('btn-new-game').addEventListener('click', ()=> location.href = 'game-form.html');
  document.getElementById('btn-new-session').addEventListener('click', ()=> location.href = 'session-create.html');

  await loadComplexities();
  await loadGames(); // initial search with all NULLs
  await loadSessions();
}

async function loadComplexities(){
  const el = document.getElementById('complexity-list');
  el.innerHTML = 'Carregando...';
  try{
    const res = await fetchJson(apiUrl('/api/Game/complexidades'));
    if(!res.ok){ el.innerHTML = 'Erro ao carregar'; return; }
    complexities = await res.json();
    el.innerHTML = '';
    complexities.forEach(c=>{
      const id = c.id ?? c.Id;
      const desc = c.descricao ?? c.Descricao;
      const wrapper = document.createElement('label');
      wrapper.className = 'checkbox-inline';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.value = id;
      input.dataset.desc = desc;
      wrapper.appendChild(input);
      const span = document.createElement('span');
      span.textContent = ' ' + desc;
      wrapper.appendChild(span);
      el.appendChild(wrapper);
    });
  }catch(e){
    el.innerHTML = 'Erro de rede';
  }
}

function buildFiltersFromUI(){
  const nome = (document.getElementById('f-nome').value || '').trim() || null;
  const dur = parseInt(document.getElementById('f-duracao').value || '') || null;
  const qtd = parseInt(document.getElementById('f-qtd').value || '') || null;
  const idade = parseInt(document.getElementById('f-idade').value || '') || null;

  const checked = Array.from(document.querySelectorAll('#complexity-list input[type=checkbox]:checked'))
    .map(i => parseInt(i.value));
  const complex = checked.length ? checked : null;

  return {
    Nome: nome,
    DuracaoMaxima: isNaN(dur) ? null : dur,
    QtdPessoas: isNaN(qtd) ? null : qtd,
    IdadeMinima: isNaN(idade) ? null : idade,
    Complexidade: complex
  };
}

async function onSearch(){
  const userId = requireAuth(); if(!userId) return;
  const filters = buildFiltersFromUI();
  await loadGames(filters);
}

async function loadGames(filters = null){
  const userId = requireAuth(); if(!userId) return;
  const tbody = document.querySelector('#games-table tbody');
  const msg = document.getElementById('games-message');
  tbody.innerHTML = '';
  msg.textContent = '';
  try{
    const res = await fetchJson(apiUrl(`/api/Game/user/${userId}/games/search`), {
      method: 'POST',
      body: JSON.stringify(filters)
    });
    if(!res.ok){ msg.textContent = 'Erro ao buscar jogos.'; return; }
    const list = await res.json();
    if(!list.length){ msg.textContent = 'Nenhum jogo encontrado.'; return; }
    for(const g of list){
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${g.nome ?? g.Nome}</td>
                      <td>${formatRange(g.qtdMinimaJogadores ?? g.QtdMinimaJogadores, g.qtdMaximaJogadores ?? g.QtdMaximaJogadores)}</td>
                      <td>${g.idadeMinima ?? g.IdadeMinima}</td>
                      <td>${g.duracaoMinutos ?? g.DuracaoMinutos}</td>
                      <td>${g.idComplexidade ?? g.IdComplexidade}</td>
                      <td>
                        <button class="btn-edit" data-id="${g.id ?? g.Id}">Editar</button>
                        <button class="btn-del" data-id="${g.id ?? g.Id}">Excluir</button>
                      </td>`;
      tbody.appendChild(tr);
    }
    tbody.querySelectorAll('.btn-del').forEach(b=>{
      b.addEventListener('click', onDeleteGame);
    });
    tbody.querySelectorAll('.btn-edit').forEach(b=>{
      b.addEventListener('click', e=>{
        const id = e.currentTarget.dataset.id;
        location.href = `game-form.html?id=${id}`;
      });
    });
  }catch(e){
    msg.textContent = 'Erro de rede.';
  }
}

async function onDeleteGame(e){
  const id = e.currentTarget.dataset.id;
  if(!confirm('Deseja realmente excluir este jogo?')) return;
  try{
    const res = await fetchJson(apiUrl(`/api/Game/delete/${id}`), { method: 'DELETE' });
    if(res.ok){
      await loadGames(buildFiltersFromUI());
    }else{
      alert('Falha ao excluir o jogo.');
    }
  }catch{
    alert('Erro de rede.');
  }
}

async function loadSessions(){
  const userId = requireAuth(); if(!userId) return;
  const tbody = document.querySelector('#sessions-table tbody');
  const msg = document.getElementById('sessions-message');
  tbody.innerHTML = '';
  msg.textContent = '';
  try{
    const res = await fetchJson(apiUrl(`/api/Session/user/${userId}/sections`));
    if(!res.ok){ msg.textContent = 'Erro ao carregar sessões.'; return; }
    const list = await res.json();
    if(!list.length){ msg.textContent = 'Nenhuma sessão criada.'; return; }
    for(const s of list){
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${s.idadeJogadorMaisNovo ?? s.IdadeJogadorMaisNovo}</td>
                      <td>${s.duracaoMinutos ?? s.DuracaoMinutos}</td>
                      <td>${s.qtdJogadores ?? s.QtdJogadores}</td>
                      <td>${s.nivelComplexidadeMinima ?? s.NivelComplexidadeMinima}</td>
                      <td>${s.nivelComplexidadeMaxima ?? s.NivelComplexidadeMaxima}</td>
                      <td>
                        <button class="btn-update-games" data-id="${s.id ?? s.Id}">Atualizar Jogos</button>
                        <button class="btn-view-games" data-id="${s.id ?? s.Id}">Visualizar Jogos</button>
                        <button class="btn-del-session" data-id="${s.id ?? s.Id}">Excluir Sessão</button>
                      </td>`;
      tbody.appendChild(tr);
    }
    tbody.querySelectorAll('.btn-update-games').forEach(b=>{
      b.addEventListener('click', e=>{
        const id = e.currentTarget.dataset.id;
        location.href = `session-games.html?sectionId=${id}`;
      });
    });
    tbody.querySelectorAll('.btn-view-games').forEach(b=>{
      b.addEventListener('click', async e=>{
        const id = e.currentTarget.dataset.id;
        await viewSessionGames(id);
      });
    });
    tbody.querySelectorAll('.btn-del-session').forEach(b=>{
      b.addEventListener('click', onDeleteSession);
    });
  }catch(e){
    msg.textContent = 'Erro de rede.';
  }
}

async function viewSessionGames(sectionId){
  try{
    const res = await fetchJson(apiUrl(`/api/Session/${sectionId}/games`));
    if(!res.ok){ alert('Erro ao obter jogos da sessão.'); return; }
    const list = await res.json();
    let text = list.map(i => `${i.nome ?? i.Nome} — ${i.duracaoMinutosAdjusted ?? i.DuracaoMinutosAdjusted} min`).join('\n');
    if(!text) text = 'Nenhum jogo na sessão.';
    alert(text);
  }catch{
    alert('Erro de rede.');
  }
}

async function onDeleteSession(e){
  const id = e.currentTarget.dataset.id;
  if(!confirm('Deseja realmente excluir esta sessão?')) return;
  try{
    const res = await fetchJson(apiUrl(`/api/Session/${id}`), { method: 'DELETE' });
    if(res.ok) await loadSessions();
    else alert('Falha ao excluir sessão.');
  }catch{
    alert('Erro de rede.');
  }
}

function onClear(){
  document.getElementById('f-nome').value = '';
  document.getElementById('f-duracao').value = '';
  document.getElementById('f-qtd').value = '';
  document.getElementById('f-idade').value = '';
  document.querySelectorAll('#complexity-list input[type=checkbox]').forEach(i=> i.checked = false);
  loadGames();
}