// session-games.js
document.addEventListener('DOMContentLoaded', init);
let section = null;
let selectedMap = new Map(); // idJogo -> primeiraVez boolean

async function init(){
  const userId = requireAuth(); if(!userId) return;
  document.getElementById('btn-back').addEventListener('click', ()=> location.href = 'dashboard.html');

  const params = new URLSearchParams(location.search);
  const sectionId = params.get('sectionId');
  if(!sectionId){ alert('Seção inválida.'); location.href='dashboard.html'; return; }

  // find section by fetching user's sections (no single endpoint on controller)
  const userSections = await fetchJson(apiUrl(`/api/Session/user/${userId}/sections`));
  if(!userSections.ok){ alert('Erro ao carregar seção.'); location.href='dashboard.html'; return; }
  const list = await userSections.json();
  section = list.find(s => (s.id ?? s.Id) == sectionId || String(s.id ?? s.Id) === sectionId);
  if(!section){ alert('Seção não encontrada.'); location.href='dashboard.html'; return; }

  document.getElementById('sec-info').innerHTML = `
    <p><strong>Idade mais nova:</strong> ${section.idadeJogadorMaisNovo ?? section.IdadeJogadorMaisNovo}</p>
    <p><strong>Duração (min):</strong> ${section.duracaoMinutos ?? section.DuracaoMinutos}</p>
    <p><strong>Qtd jogadores:</strong> ${section.qtdJogadores ?? section.QtdJogadores}</p>
    <p><strong>Complexidade:</strong> ${section.nivelComplexidadeMinima ?? section.NivelComplexidadeMinima} → ${section.nivelComplexidadeMaxima ?? section.NivelComplexidadeMaxima}</p>
  `;

  await loadCompatibleGames(section);
  await loadSessionGames(sectionId);
}

function buildComplexityRange(min, max){
  const arr = [];
  for(let i = min; i <= max; i++) arr.push(i);
  return arr;
}

async function loadCompatibleGames(sec){
  const msg = document.getElementById('compatible-message'); msg.textContent = '';
  const tbody = document.querySelector('#compatible-table tbody'); tbody.innerHTML = '';
  try{
    const filters = {
      Nome: null,
      DuracaoMaxima: null,
      QtdPessoas: sec.qtdJogadores ?? sec.QtdJogadores,
      IdadeMinima: sec.idadeJogadorMaisNovo ?? sec.IdadeJogadorMaisNovo,
      Complexidade: buildComplexityRange(sec.nivelComplexidadeMinima ?? sec.NivelComplexidadeMinima, sec.nivelComplexidadeMaxima ?? sec.NivelComplexidadeMaxima)
    };
    const res = await fetchJson(apiUrl(`/api/Game/user/${sec.idUsuario ?? sec.IdUsuario}/games/search`), {
      method: 'POST', body: JSON.stringify(filters)
    });
    if(!res.ok){ msg.textContent = 'Erro ao buscar jogos compatíveis.'; return; }
    const list = await res.json();
    if(!list.length){ msg.textContent = 'Nenhum jogo compatível encontrado.'; return; }
    for(const g of list){
      const id = g.id ?? g.Id;
      const tr = document.createElement('tr');
      tr.innerHTML = `<td><input type="checkbox" data-id="${id}" /></td>
                      <td>${g.nome ?? g.Nome}</td>
                      <td>${formatRange(g.qtdMinimaJogadores ?? g.QtdMinimaJogadores, g.qtdMaximaJogadores ?? g.QtdMaximaJogadores)}</td>
                      <td>${g.idadeMinima ?? g.IdadeMinima}</td>
                      <td>${g.duracaoMinutos ?? g.DuracaoMinutos}</td>`;
      tbody.appendChild(tr);
    }

    tbody.querySelectorAll('input[type=checkbox]').forEach(cb=>{
      cb.addEventListener('change', onCheckboxToggle);
    });
    tbody.querySelectorAll('.ask-first').forEach(b=>{
      b.addEventListener('click', onAskFirst);
    });
  }catch{
    msg.textContent = 'Erro de rede.';
  }
}

async function onAskFirst(e){
  const id = e.currentTarget.dataset.id;
  const isFirst = confirm('Esta é a primeira vez que o jogador joga este jogo? (OK = Sim, Cancel = Não)');
  selectedMap.set(id, isFirst);
  // ensure checkbox is checked if user chose to include
  const cb = document.querySelector(`#compatible-table input[type=checkbox][data-id="${id}"]`);
  if(cb) cb.checked = true;
  // trigger update to backend
  await sendUpdate();
}

async function onCheckboxToggle(e){
  const id = e.currentTarget.dataset.id;
  if(e.currentTarget.checked){
    // ask if first time
    const isFirst = confirm('É a primeira vez que joga este jogo? (OK = Sim, Cancel = Não)');
    selectedMap.set(id, isFirst);
  }else{
    selectedMap.delete(id);
  }
  await sendUpdate();
}

async function sendUpdate(){
  const sectionId = new URLSearchParams(location.search).get('sectionId');
  const jogos = Array.from(selectedMap.entries()).map(([k,v])=>({ IdJogo: k, PrimeiraVez: v }));
  try{
    const res = await fetchJson(apiUrl('/api/Session/update-games'), {
      method: 'POST', body: JSON.stringify({ IdSecao: sectionId, Jogos: jogos })
    });
    if(!res.ok){
      const err = await res.text();
      document.getElementById('compatible-message').textContent = err || 'Falha ao atualizar jogos da sessão.';
      return;
    }
    document.getElementById('compatible-message').textContent = 'Atualizado com sucesso.';
    await loadSessionGames(sectionId);
  }catch{
    document.getElementById('compatible-message').textContent = 'Erro de rede.';
  }
}

async function loadSessionGames(sectionId){
  const tbody = document.querySelector('#session-games-table tbody'); tbody.innerHTML = '';
  const msg = document.getElementById('session-games-message'); msg.textContent = '';
  try{
    const res = await fetchJson(apiUrl(`/api/Session/${sectionId}/games`));
    if(!res.ok){ msg.textContent = 'Erro ao carregar jogos da sessão.'; return; }
    const list = await res.json();
    if(!list.length){ msg.textContent = 'Nenhum jogo na sessão.'; return; }
    for(const g of list){
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${g.nome ?? g.Nome}</td><td>${g.duracaoMinutosAdjusted ?? g.DuracaoMinutosAdjusted}</td>`;
      tbody.appendChild(tr);
      // mark checkboxes for those present
      const cb = document.querySelector(`#compatible-table input[type=checkbox][data-id="${g.idJogo ?? g.IdJogo}"]`);
      if(cb){ cb.checked = true; selectedMap.set((g.idJogo ?? g.IdJogo), g.primeiraVez ?? g.PrimeiraVez); }
    }
  }catch{
    msg.textContent = 'Erro de rede.';
  }
}