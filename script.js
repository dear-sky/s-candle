// ==========================================
// 1. アイコン画像置換の設定＆関数
// ==========================================
const IMG_BASE_PATH = 'ssc_img/';

const iconMap = {
  '🕯️': 'icon_candle.png'
};

// 文字列内の絵文字を <img> タグに変換する関数
function replaceEmojisWithIcons(inputText) {
  let result = String(inputText);
  for (const [emoji, fileName] of Object.entries(iconMap)) {
    const imgTag = `<img src="${IMG_BASE_PATH}${fileName}" alt="${emoji}" class="pixel-icon">`;
    result = result.replaceAll(emoji, imgTag);
  }
  return result;
}

// ==========================================
// 2. メイン処理（Sky Season Calc）
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  const startDateInput = document.getElementById("input-start-date");
  const endDateInput = document.getElementById("input-end-date");
  const targetInput = document.getElementById("input-target-candles");
  const passToggle = document.getElementById("toggle-pass");

  const targetCostText = document.getElementById("target-cost");
  const possibleGetText = document.getElementById("possible-get");
  const statusText = document.getElementById("status-text");
  
  // 新しく追加した「必要日数」表示用の要素
  const requiredDaysText = document.getElementById("required-days-text");

  // デフォルト: 開始日のみ今日、終了日は未選択
  const today = new Date();
  if (startDateInput) startDateInput.value = formatDate(today);
  if (endDateInput) endDateInput.value = "";

  function formatDate(d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  /*
    【Sky更新仕様】
    開始日の 16:00/17:00 から 終了日の 16:00/17:00 までの更新回数を算出。
  */
  function calculateResetCycles(startStr, endStr) {
    if (!startStr || !endStr) return 0;

    const s = startStr.split('-').map(Number);
    const e = endStr.split('-').map(Number);

    if (s.length !== 3 || e.length !== 3) return 0;

    const startUtc = Date.UTC(s[0], s[1] - 1, s[2]);
    const endUtc = Date.UTC(e[0], e[1] - 1, e[2]);

    if (startUtc > endUtc) return 0;

    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.floor((endUtc - startUtc) / msPerDay);
  }

  function calculate() {
    const startVal = startDateInput ? startDateInput.value : "";
    const endVal = endDateInput ? endDateInput.value : "";
    const targetCost = targetInput ? (parseInt(targetInput.value, 10) || 0) : 0;
    const hasPass = passToggle ? passToggle.checked : false;

    // --- ① 目標コスト ---
    if (targetCostText) {
      targetCostText.innerHTML = replaceEmojisWithIcons(`🕯️ ${targetCost}`);
    }

    // 更新サイクルの回数（日）
    const totalDays = calculateResetCycles(startVal, endVal);

    if (totalDays <= 0) {
      if (possibleGetText) possibleGetText.innerHTML = replaceEmojisWithIcons("🕯️ -");
      if (statusText) {
        statusText.textContent = "終了日を設定";
        statusText.style.color = "#0284c7";
      }
      if (requiredDaysText) requiredDaysText.textContent = "";
      return;
    }

    // --- ② 獲得可能数 ---
    const dailyRate = hasPass ? 6 : 5;
    const passBonus = hasPass ? 30 : 0;
    const maxPossible = (totalDays * dailyRate) + passBonus;

    if (possibleGetText) {
      possibleGetText.innerHTML = replaceEmojisWithIcons(`🕯️ ${maxPossible}`);
    }

    // --- ③ 既存のステータス表示（＋差分 / －不足分） ---
    if (statusText) {
      if (targetCost <= 0) {
        statusText.textContent = "目標数を設定";
        statusText.style.color = "#0284c7";
      } else if (maxPossible >= targetCost) {
        const surplus = maxPossible - targetCost;
        statusText.innerHTML = replaceEmojisWithIcons(`+🕯️${surplus}`);
        statusText.style.color = "#0284c7";
      } else {
        const shortage = targetCost - maxPossible;
        statusText.innerHTML = replaceEmojisWithIcons(`－🕯️${shortage}`);
        statusText.style.color = "#bb5959";
      }
    }

    // --- ④ 新設：《◯◯日中〇〇日で達成》の表示 ---
    if (requiredDaysText) {
      if (targetCost <= 0) {
        requiredDaysText.textContent = "";
      } else {
        // 必要日数の計算（パスありなら特典30本を先に引く）
        let neededDays = 0;
        if (hasPass) {
          const remainingCost = Math.max(0, targetCost - 30);
          neededDays = Math.ceil(remainingCost / 6);
        } else {
          neededDays = Math.ceil(targetCost / 5);
        }

        if (maxPossible >= targetCost) {
          // 期間内で達成できる場合
          requiredDaysText.textContent = `《 ${totalDays}日中${neededDays}日で達成 》`;
          requiredDaysText.style.color = "#333333"; // お好みの文字色に調整してください
        } else {
          // 期間内で届かない場合
          requiredDaysText.textContent = `《 ${totalDays}日では達成不可 》`;
          requiredDaysText.style.color = "#bb5959";
        }
      }
    }
  }

  // イベントリスナー
  ["change", "input"].forEach(evt => {
    if (startDateInput) startDateInput.addEventListener(evt, calculate);
    if (endDateInput) endDateInput.addEventListener(evt, calculate);
    if (targetInput) targetInput.addEventListener(evt, calculate);
    if (passToggle) passToggle.addEventListener(evt, calculate);
  });

  calculate();
});

// 日付入力欄をFlatpickrに適用
flatpickr('input[type="date"]', {
  locale: 'ja',
  dateFormat: 'Y-m-d',
  disableMobile: "true",
  onChange: function() {
    calculate(); // カレンダー選択時に再計算を発火
  }
});