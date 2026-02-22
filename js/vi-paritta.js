/* =========================================
   FULL PALI LOOKUP INTEGRATION
   ========================================= */

// Flag to satisfy the check in lookupWordHandler
window.paliDictionary = true;
var isLookupEnabled = false;
// Thêm biến Timer để quản lý độ trễ cho sự kiện mouseenter
var lookupTimer = null; 
// Mặc định: Độ trễ 100ms
const LOOKUP_DELAY_MS = 100; 

function togglePaliLookup() {
    isLookupEnabled = !isLookupEnabled;
    const btn = document.getElementById('btn-dictionary');
    
    // --- SAVE TO LOCAL STORAGE ---
    localStorage.setItem('dictionaryEnabled', isLookupEnabled);

    if (isLookupEnabled) {
        btn.style.backgroundColor = "#d35400"; // Active color (Orange)
        enablePaliLookup();
    } else {
        btn.style.backgroundColor = ""; // Default color
        disablePaliLookup();
    }
}

function enablePaliLookup() {
    // 1. Add visual indicator
    $('.word').addClass('lookup-active');
    
    // 2. Gỡ bỏ các event handler cũ
    $(document).off('mouseenter', '.word'); 
    $(document).off('mouseleave', '.word'); 

    // MOUSEENTER: Thiết lập độ trễ (delay)
    $(document).on('mouseenter', '.word', function() {
        var $word = $(this);
        // Xóa bất kỳ timer nào đang chạy từ các từ khác
        if (lookupTimer) {
            clearTimeout(lookupTimer);
        }
        
        // Thiết lập timer mới
        lookupTimer = setTimeout(function() {
            // Chỉ hiển thị popup nếu con trỏ vẫn còn trên từ
            if ($word.is(':hover')) {
                // Dùng .call() để đảm bảo 'this' trong lookupWordHandler là phần tử DOM hiện tại
                lookupWordHandler.call($word[0]); 
            }
            lookupTimer = null; // Reset timer sau khi chạy
        }, LOOKUP_DELAY_MS); 
    });
    
    // MOUSELEAVE: Xóa timer và tắt popup ngay lập tức
    $(document).on('mouseleave', '.word', function() {
        // 1. Xóa timer hiện popup đang chờ (nếu có)
        if (lookupTimer) {
            clearTimeout(lookupTimer);
            lookupTimer = null;
        }
        
        // 2. Xóa popup đang hiển thị (nếu có)
        $(this).find('span.meaning').remove();
    });
}

function disablePaliLookup() {
    // Đảm bảo xóa timer nếu nó đang chạy khi tắt tính năng
    if (lookupTimer) {
        clearTimeout(lookupTimer);
        lookupTimer = null;
    }
    $('.word').removeClass('lookup-active');
    $(document).off('mouseenter', '.word');
    $(document).off('mouseleave', '.word');
    $('.meaning').remove();
}



function lookupWordHandler(event) {
    if (!window.paliDictionary) return;
    if ($(this).children().is("span.meaning")) return;

    const $wordElement = $(this);
    const rawElementText = this.innerText || $(this).text();
    const isRecitationActive = document.body.classList.contains('recitation-active-mode');

    // --- HELPER: Dictionary Rendering Logic ---
    function showDictionary() {
        var word = rawElementText.toLowerCase().trim();

        // CRITICAL FIX: Remove punctuation from edges
        word = word.replace(/^[“‘"(\[]+|[”’"),‚.\]?!:–;]+$/g, '');

        // Standard replacements
        word = word.replace(/­/g, ''); 
        word = word.replace(/ṁg/g, 'ṅg')
                   .replace(/ṁk/g, 'ṅk')
                   .replace(/ṁ/g, 'ṁ'); 

        // Perform Lookup
        var meaning = lookupWord(word, rawElementText); 
        
        if (meaning) {
            var dictBox = $('<span class="meaning">' + meaning + '</span>');
            
            // Prevent bubbling on the dictionary box too
            dictBox.on('click touchstart', function(e) {
                e.stopPropagation();
            });

            $wordElement.append(dictBox);
            
            // Prevent popup from going off-screen (Right edge detection)
            var offset = $wordElement.offset();
            var width = 300; // approx max width
            if (offset.left + width > $(window).width()) {
                 dictBox.css({left: 'auto', right: 0});
            }
        }
    }

    // --- RECITATION MODE: Rhythm Box Logic ---
    if (isRecitationActive) {
        const cleanText = rawElementText.toLowerCase().replace(/[.,:;!?'"“”‘’()\[\]{}...–-]/g, '').trim();

        // 1. FIND WORD POSITION (Index in the sentence/line)
        const wordIndex = $wordElement.parent().find('.word').index(this);

        // 2. DEFINE THEME-SPECIFIC COLORS
        const isDarkMode = document.body.getAttribute('data-theme') === 'dark';
        const lightModeColors = [
            '#c0392b', '#2980b9', '#27ae60', '#8e44ad', '#d35400', 
            '#2c3e50', '#16a085', '#b53471', '#5758bb', '#1b1464',
            '#006266', '#6F1E51', '#1289A7', '#D980FA', '#0652DD',
            '#c23616', '#192a56', '#2f3640', '#44bd32', '#833471'
        ];
        const darkModeColors = [
            '#ff7675', '#74b9ff', '#55e6c1', '#a29bfe', '#fab1a0',
            '#18dcff', '#7d5fff', '#ffaf40', '#32ff7e', '#ff3838',
            '#ffeaa7', '#81ecec', '#fdcb6e', '#fd79a8', '#55efc4',
            '#00d2d3', '#00cec9', '#fab1a0', '#ff9f43', '#fffa65',
        ];

        const colorPalette = isDarkMode ? darkModeColors : lightModeColors;
        const wordColor = colorPalette[wordIndex % colorPalette.length];

        // 3. ACCURATE PALI RHYTHM ANALYSIS
        const longVowels = ['ā', 'ī', 'ū', 'e', 'o'];
        const vowels = 'aāiīuūeo';
        const aspirates = ['kh', 'gh', 'ch', 'jh', 'ṭh', 'ḍh', 'th', 'dh', 'ph', 'bh'];
        
        let rhythm = [];
        for (let i = 0; i < cleanText.length; i++) {
            let char = cleanText[i];
            if (vowels.includes(char)) {
                let isGuru = false;
                if (longVowels.includes(char)) {
                    isGuru = true;
                } else {
                    let nextPart = cleanText.slice(i + 1);
                    if (nextPart.startsWith('ṁ')) {
                        isGuru = true;
                    } else {
                        let following = nextPart.match(/^([^aāiīuūeo]+)/);
                        if (following) {
                            let cluster = following[0];
                            let tempCluster = cluster;
                            aspirates.forEach(a => { tempCluster = tempCluster.replace(a, 'K'); });
                            if (tempCluster.length > 1) isGuru = true;
                        }
                    }
                }
                rhythm.push(isGuru ? 'fa-minus' : 'fa-circle');
            }
        }

        // 4. RENDER RHYTHM BOX
        let symbolsHtml = rhythm.map(icon => {
            const size = (icon === 'fa-minus') ? '18px' : '10px';
            return `<i class="fas ${icon}" style="font-size: ${size}; margin: 0 4px; text-shadow: 1px 1px 1px rgba(0,0,0,0.1);"></i>`;
        }).join('');

        // Added 'cursor: pointer' so it's obviously clickable
        const textBox = $(`
            <span class="meaning rhythm-box" style="min-width: 60px; padding: 12px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer;">
                <div style="color: ${wordColor}; display: flex; align-items: center; justify-content: center; gap: 2px;">
                    ${symbolsHtml}
                </div>
                <div style="font-size: 10px; margin-top: 4px; opacity: 0.6; color: inherit;">Chạm để tra từ</div>
            </span>
        `);
        
        // --- CLICK EVENT: Switch to Dictionary ---
        textBox.on('click touchstart', function(e) {
            e.stopPropagation(); // Stop event bubbling on mobile
            if (e.type === 'touchstart') e.preventDefault(); // Stop double-firing from emulated clicks
            
            $(this).remove(); // Hide the rhythm box
            showDictionary(); // Fire the dictionary meaning script
        });

        $wordElement.append(textBox);
        
        var offset = $wordElement.offset();
        if (offset.left + textBox.outerWidth() > $(window).width()) {
             textBox.css({left: 'auto', right: 0});
        }
        return; 
    }

    // --- NORMAL MODE: Direct Dictionary Lookup ---
    showDictionary();
}

/* --- LOOKUP LOGIC (Exact copy of logic from pali-lookup-standalone.js) --- */
function lookupWord(word, displayTitle) {
    // Safety check for data
    if (typeof dpd_i2h === 'undefined') {
        console.warn("Pali Data (dpd_i2h) not loaded!");
        return "<i>Dictionary data not found.<br>Please check console.</i>";
    }

    let out = "";
    
    // Logic from original: replace quotes and normalize 'ṁ' to 'ṃ' for dictionary keys
    const originalWord = word;
    var lookupKey = word.replace(/[’”'"]/g, "").replace(/ṁ/g, "ṃ");

    // 1. Dictionary Lookup (dpd_i2h)
    if (lookupKey in dpd_i2h) {
        out += `<strong>${originalWord}</strong>`;
        out += `<ul style="line-height: 1.4em; padding-left: 15px; margin-top: 4px; list-style: disc inside;">`;
        
        for (const headword of dpd_i2h[lookupKey]) {
            if (headword in dpd_ebts) {
                // Formatting logic from original script
                const match = headword.match(/^(.+?)\s(\d[\d.]*)$/);
                let formattedHeadword;
                if (match) {
                    const wordPart = match[1].trim();
                    const numberPart = match[2];
                    formattedHeadword = `${wordPart}<sub style="font-size:60%; font-weight:bold;">${numberPart}</sub>`;
                } else {
                    formattedHeadword = headword;
                }
                out += `<li><b>${formattedHeadword}</b>: ${dpd_ebts[headword]}</li>`;
            }
        }
        out += "</ul>";
    }

    // 2. Deconstructor Lookup (dpd_deconstructor)
    if (typeof dpd_deconstructor !== 'undefined' && lookupKey in dpd_deconstructor) {
        if(out === "") out += `<strong>${originalWord}</strong><br>`; // Header if not already added
        out += `<div style="margin-top:8px; border-top:1px solid #555; padding-top:4px;">
                <small style="color:#aaa"></small>
                ${dpd_deconstructor[lookupKey]}
                </div>`;
    }

    return out === "" ? null : out.replace(/ṁ/g, "ṃ");
}

    const introContent = `
        <h4>DẪN NHẬP</h4>
        <p><i><b>“Uggaṇhātha, bhikkhave, āṭānāṭiyaṃ rakkhaṃ. Pariyāpuṇātha, bhikkhave, āṭānāṭiyaṃ rakkhaṃ. Dhāretha, bhikkhave, āṭānāṭiyaṃ rakkhaṃ. Atthasaṃhitā, bhikkhave, āṭānāṭiyā rakkhā bhikkhūnaṃ bhikkhunīnaṃ upāsakṃnaṃ upāsikānaṃ guttiyā rakkhāya avihiṃsāya phāsuvihārāyā”ti.</b></i> (Trích Trường Bộ Kinh 32).</p>
        
        <p><i>“Này các Tỷ-kheo, hãy học Hộ Kinh Āṭānāṭiya này, hãy thuộc lòng Kinh Āṭānāṭiya này. Này các Tỷ-kheo, Tỷ-kheo-ni, Nam cư sĩ, Nữ cư sĩ được che chở, được hộ trì, được ngăn khỏi bị làm hại, được sống thoải mái hạnh phúc.”</i></p>
        
        <p>Với những lời này, Đức Phật đã khuyến khích các hàng đệ tử học tập kinh hộ trì Āṭānāṭiya để tự bảo vệ mình, và từ đó bắt đầu truyền thống tụng đọc các bài Kinh để cầu sự bảo vệ và những kết quả tốt lành. Các bài Kinh được tụng để bảo vệ còn được gọi là Kinh Hộ Trì hay ‘Paritta’, nghĩa là “bài Kinh bảo vệ những người tụng và người nghe khỏi những nguy hiểm, tai họa, v.v., từ khắp xung quanh.” Trải qua các thời đại, các bài Kinh khác đã được thêm vào danh sách ‘Các Kinh để tụng’. Như trong bộ Milindapañha (Mi Tiên Vấn Đáp) và các Chú giải của Ngài Buddhaghosa, có chín bài Kinh được nhắc đến như là Kinh Hộ Trì: <b>Ratanasutta, Mettāsutta, Khandhasutta, Morasutta, Dhajaggasutta, Āṭānāṭiyasutta, Aṅgulimālasutta, Bojhaṅgasutta</b> và <b>Isigilisutta</b>.</p>
        
        <p>Tập kinh trình bày ở đây bao gồm tám bài Kinh đầu tiên và thêm vào đó là cá kinh Maṅgalasutta, Vaṭṭasutta và Pubbaṇhasutta, tổng cộng gồm 11 bài Kinh, cùng với các câu kệ mở đầu cho mỗi bài. Đây là 11 bài Kinh được tụng hàng ngày tại mọi tu viện, chùa chiền và tại nhà của các cư sĩ ở tất cả các quốc gia Phật giáo Theravāda (Phật giáo Nguyên thủy). Bộ sưu tập này được biết đến ở Myanmar với tên gọi ‘Đại Hộ Kinh’, không phải vì các bài Kinh trong đó dài, mà có lẽ vì chúng có sức mạnh to lớn, nếu được trì tụng và lắng nghe đúng đắn, có thể xua tan nguy hiểm và mang lại những kết quả nhiệm màu.</p>
        
        <h4>CÁCH TRÌ TỤNG VÀ LẮNG NGHE KINH</h4>
        <p>Vì các bài Kinh Hộ Trì Paritta này nhằm mục đích bảo vệ và mang lại các kết quả tốt đẹp khác, điều quan trọng là chúng phải được tụng và nghe một cách chính xác. Có một số điều kiện cần được thực hiện bởi cả người tụng và người nghe để nhận được trọn vẹn lợi ích của Kinh Paritta. Cụ thể, có ba điều kiện cho người tụng đọc và ba điều kiện cho người lắng nghe:</p>
        
        <b>Ba điều kiện đối với người tụng đọc:</b>
        <ol>
            <li>Họ phải học và tụng các bài Kinh một cách chính xác và đầy đủ, không được bỏ sót.</li>
            <li>Họ phải hiểu ý nghĩa của các bài Kinh đang được tụng.</li>
            <li>Họ phải tụng với tâm tràn đầy lòng hoan hỷ và từ tâm.</li>
        </ol>
        
        <b>Ba điều kiện đối với người nghe:</b>
        <ol>
            <li>Họ phải không phạm vào ngũ nghịch đại tội: giết cha, giết mẹ, giết bậc A-la-hán, làm thân Phật chảy máu, và làm chia rẽ Tăng đoàn.</li>
            <li>Họ phải không có ‘tà kiến cố định’ (tà kiến bác bỏ nghiệp và quả của nghiệp).</li>
            <li>Họ phải lắng nghe với niềm tin vào hiệu năng của các bài Kinh trong việc ngăn chặn nguy hiểm và mang lại kết quả tốt lành. (Khi mọi người nghe với niềm tin, họ sẽ nghe với sự tôn trọng và chú tâm).</li>
        </ol>
        
        <p>Chỉ khi các điều kiện này được đáp ứng, mọi người mới nhận được đầy đủ lợi ích từ các bài Kinh Paritta. Do đó, điều quan trọng là khi Kinh đang được tụng, mọi người nên lắng nghe với chú ý, tín tâm và sự tôn trọng. Hơn nữa, việc tụng Kinh Paritta là một hành động phát sanh 2 lợi ích. Người tụng giống như người cho đi, và người nghe giống như người nhận; nếu không nhận những gì được cho, họ sẽ không có được món đồ đó. Tương tự như vậy, nếu mọi người không lắng nghe mà lại làm việc khác trong khi người khác tụng, họ chắc chắn sẽ không nhận được lợi ích của việc tụng Kinh.</p>
        
        <h4>NGUỒN TRÍCH DẪN</h4>
        <p>Ngoại trừ các câu kệ mở đầu, các bài Kinh được tìm thấy trong Tam Tạng (Piṭaka) như sau:<br>
        <small>(Số tham chiếu là số trang của Ấn bản Đại hội Kết tập Kinh điển lần thứ VI, ngoại trừ Jātaka (Bổn sanh) được ghi theo số thứ tự của các chuyện Tiền thân).</small></p>
        
        <ul>
            <li><b>Phần mở đầu (Parikamma)</b> => do các nhà kết tập biên soạn.</li>
            <li><b>1. Maṅgalasutta</b> => Khuddakapāṭha, 3-4; Suttanipāta, 308-9.</li>
            
            <li><b>2. Ratatasutta</b><br>
            Đoạn dẫn nhập => Dhammapada Aṭṭhakathā, ii. 272,<br>
            Hai câu kệ tiếp theo => do các nhà kết tập biên soạn,<br>
            Nội dung còn lại => Khuddakapāṭha, 4-7; Suttanipāta, 312-5.</li>
            
            <li><b>3. Mettāsutta</b> => Khuddakapāṭha, 10-12; Suttanipāta, 300-1.</li>
            <li><b>4. Khandhasutta</b> => Vinaya. iv. 245; Aṅguttaranikāya, i. 384; Jātaka số 203.</li>
            <li><b>5. Morasutta</b> => Jātaka số 159.</li>
            <li><b>6. Vaṭṭasutta</b> => Cariyapiṭaka, 415.</li>
            <li><b>7. Dhajaggasutta</b> => Saṃyuttanikāya, i. 220-2.</li>
            
            <li><b>8. Āṭānāṭiyasutta</b><br>
            Các câu kệ 104-109 => Dīghanikāya, iii. 159.<br>
            Các câu kệ 102, 103, 110-130 => do các nhà kết tập biên soạn.<br>
            Câu kệ 131 => Kinh Pháp Cú (Dhammapada), câu 109.</li>
            
            <li><b>9. Aṅgulimālasutta</b> => Majjhimanikāya, ii. 306.</li>
            
            <li><b>10. Bojjhaṅgasutta</b><br>
            Các bài Kinh gốc => Saṃyuttanikāya, iii. 71, 72, 73.<br>
            Các câu kệ ở đây => do các nhà kết tập biên soạn.</li>
            
            <li><b>11. Pubbaṇhasutta</b><br>
            Câu kệ 153 => Khuddakapāṭha, 5; Suttanipāta, 312.<br>
            Các câu kệ 162-4 => Aṅguttaranikāya, i. 299.<br>
            Phần còn lại => do các nhà kết tập biên soạn.</li>
        </ul>

        <h4>CÔNG DỤNG CỦA CÁC BÀI KINH HỘ TRÌ</h4>
        <p>Mặc dù các bài Kinh Paritta nhìn chung là để tụng đọc, nhưng một số bài kinh cũng cần được thực hành. Chỉ có các Kinh Châu Báu (Ratanasutta), Kinh Con Công (Morasutta), Kinh Chim Cút (Vaṭṭasutta), Kinh Āṭānāṭiya, Kinh Aṅgulimāla và Kinh Ban Mai (Pubbaṇhasutta) là dành riêng cho việc tụng đọc; các bài khác dùng cho cả việc tụng đọc và thực hành. Mỗi bài Kinh có những công dụng cụ thể mặc dù mục đích chung là bảo vệ khỏi nguy hiểm. Các công dụng cụ thể có thể được tìm thấy trong các câu kệ dẫn nhập của mỗi bài Kinh, tóm tắt như sau:</p>
        
        <ul style="list-style-type: none; padding-left: 0;">
            <li><b>1. Maṅgalasutta</b> => cầu phước lành và thịnh vượng.</li>
            <li><b>2. Ratatasutta</b> => để thoát khỏi các nguy hiểm do bệnh tật, tà ma và nạn đói.</li>
            <li><b>3. Mettāsutta</b> => để lan tỏa lòng từ ái đến tất cả chúng sinh.</li>
            <li><b>4. Khandhasutta</b> => để bảo vệ khỏi rắn rết và các loài bò sát khác.</li>
            <li><b>5. Morasutta</b> => để bảo vệ khỏi cạm bẫy, sự giam cầm và được an toàn.</li>
            <li><b>6. Vaṭṭasutta</b> => để bảo vệ khỏi hỏa hoạn.</li>
            <li><b>7. Dhajaggasutta</b> => để bảo vệ khỏi sự sợ hãi, run rẩy và kinh hoàng.</li>
            <li><b>8. Āṭānāṭiyasutta</b> => để bảo vệ khỏi tà ma, có được sức khỏe và hạnh phúc.</li>
            <li><b>9. Aṅgulimālasutta</b> => để giúp các sản phụ dễ dàng sinh nở.</li>
            <li><b>10. Bojjhaṅgasutta</b> => để bảo vệ và thoát khỏi ốm đau, bệnh tật.</li>
            <li><b>11. Pubbaṇhasutta</b> => để bảo vệ khỏi điềm xấu, v.v., và có được hạnh phúc.</li>
        </ul>
        
        <h4>RẢI TÂM TỪ</h4>
        <p>Chưa bao giờ sự cần thiết của lòng từ ái (tâm từ) lại được cảm nhận sâu sắc như ngày nay khi bạo lực tràn lan khắp thế giới. Nếu chúng ta không giảm bớt bạo lực, thế giới sẽ trở thành địa ngục cho tất cả mọi người. Do đó, điều cấp thiết là chúng ta phải làm gì đó để ít nhất là giảm bớt bạo lực ngay cả khi không thể xóa sạch nó hoàn toàn. Việc thực hành lòng từ ái có thể giúp chúng ta đạt được mục tiêu đó; chúng ta có thể giúp giảm bớt bạo lực bằng tâm từ và làm cho mọi thứ tốt đẹp hơn cho tất cả chúng sinh.</p>
        
        <h4>HỒI HƯỚNG PHƯỚC BÁU</h4>
        <p>‘Hồi hướng phước báu’ luôn là một hành động đẹp mỗi khi chúng ta làm được việc thiện sự. Khi các bài Kinh Paritta được tụng với âm hưởng trầm bổng và được lắng nghe với niềm tin thành kính, lợi ích tức thì mà chúng mang lại là sự thanh thản, tĩnh lặng, bình an và niềm hỷ lạc. Nhiều thế hệ đã hưởng được những lợi ích này của Paritta và Mettā trong rất nhiều năm qua. Những lợi ích này cũng dành cho chúng ta nếu chúng ta biết tụng, nghe và thực hành đúng cách. Nguyện cầu cho tất cả chúng sinh tận hưởng được lợi ích của Paritta và Mettā theo những lời hướng dẫn ở đây.</p>
        
        <p><i>U Sīlānanda, Aggamahāpaṇḍita<br>Hoa Kỳ, 1998</i></p>
    `;

const sectionInfoData = {
    'Paritta': introContent,
    'MS': introContent,
    'Ratana': introContent,
    'Metta': introContent,
    'Khandha': introContent,
    'Mora': introContent,
    'Vaṭṭa': introContent,
    'Dhajagga': introContent,
    'Āṭānāṭiya': introContent,
    'Aṅgulimāla': introContent,
    'Bojjhaṅga': introContent,
    'Pubbaṇha': introContent
};
   const sections = [
      {
    id: 'Paritta', title: 'Paritta Parikamma', title_vn: 'Kệ Mở Đầu Hộ Kinh', audio: '00-ParittaPalikamma.mp3',
    text: `Namo tassa Bhagavato Arahato Sammāsambuddhassa. [12.437]
Xin thành kính lễ Ngài, Thế Tôn, A-La-Hán, Đấng Toàn Tri diệu giác
Namo tassa Bhagavato Arahato Sammāsambuddhassa. [7.939]
Xin thành kính lễ Ngài, Thế Tôn, A-La-Hán, Đấng Toàn Tri diệu giác
Namo tassa Bhagavato Arahato Sammāsambuddhassa. [8.598]
Xin thành kính lễ Ngài, Thế Tôn, A-La-Hán, Đấng Toàn Tri diệu giác

Samantā cakkavāḷesu, atrāgacchantu devatā, [7.882]
Này hỡi các Thiên giả, từ trong những Thiên hà xin hãy đến nơi đây,
Saddhammaṃ Munirājassa, suṇantu saggamokkhadaṃ: [7.479]
Và lắng nghe diệu pháp; Pháp Thiên lạc, giải thoát của Hiền Vương Thích Ca.
Dhammassavanakālo ayaṃ bhadantā! [5.732]
Này hỡi chư hiền giả, giờ này xin nghe pháp.
Dhammassavanakālo ayaṃ bhadantā! [4.725]
Này hỡi chư hiền giả, giờ này xin nghe pháp.
Dhammassavanakālo ayaṃ bhadantā! [5.419]
Này hỡi chư hiền giả, giờ này xin nghe pháp.

Namo tassa Bhagavato Arahato Sammāsambuddhassa. [6.986]
Xin thành kính lễ Ngài, Thế Tôn, A-La-Hán, Đấng Toàn Tri diệu giác.
Namo tassa Bhagavato Arahato Sammāsambuddhassa. [7.434]
Xin thành kính lễ Ngài, Thế Tôn, A-La-Hán, Đấng Toàn Tri diệu giác.
Namo tassa Bhagavato Arahato Sammāsambuddhassa. [7.815]
Xin thành kính lễ Ngài, Thế Tôn, A-La-Hán, Đấng Toàn Tri diệu giác.

Ye santā santacittā, tisaraṇasaraṇā, ettha lokantare vā, [9.673]
Những hiền trí nào có tâm an tịnh, đã nương tựa vào ba ngôi báu, ở thế giới này hay thế giới khác,
Bhummā bhummā ca devā, guṇagaṇagahaṇa byāvaṭā sabbakālaṃ, [9.472]
Và chư địa tiên hay Thiên tiên, những vị thường tích lũy vô vàn công đức.
Ete āyantu devā, varakanakamaye, Merurāje vasanto, [8.867]
Xin hãy đến nơi đây, những vị an lạc Thiên ngự ở núi chúa Mê-Ru bằng vàng ròng cao quý.
Santo santo sahetuṃ, Munivaravacanaṃ, sotumaggaṃ samaggā. [9.942]
Hãy đồng lòng lắng nghe những lời châu báu của Đức đại hiền (Mâu-Ni) cao thượng là nguồn của sự an lạc.

Sabbesu cakkavāḷesu, yakkhā devā ca brahmano, [7.255]
Từ trong tất cả các Thiên hà, chư Dạ Xoa, chư Thiên và chư Đại Phạm Thiên.
Yaṃ amhehi kataṃ puññaṃ, sabbasampattisādhakaṃ, [6.605]
Những công đức nào được làm bởi chúng tôi, khiến trọn vẹn tất cả những sự thành tựu,
Sabbe taṃ anumoditvā, samaggā sāsane ratā, [6.852]
Xin hãy tùy hỷ với tất cả những công đức ấy, tận tâm hòa hợp trong giáo pháp,
Pamādarahitā hontu, ārakkhāsu visesato. [7.210]
Và cùng nhau bảo vệ không xao lãng.

Sāsanassa ca lokassa, vuḍḍhī bhavatu sabbadā, [6.382]
Nguyện cầu những hưng thịnh, hằng hiện hữu cho thế giới và cho giáo pháp.
Sāsanampi ca lokañca, devā rakkhantu sabbadā. [7.568]
Xin chư Thiên hằng hộ trì cho thế giới và giáo pháp.
Saddhiṃ hontu sukhī sabbe, parivārehi attano, [6.986]
Nguyện cầu cho các sanh linh, cùng tất cả tùy tùng, họ hàng quyến thuộc, được an lạc,
Anīghā sumanā hontu, saha sabbehi ñātibhi. [7.367]
Đẹp ý, và thoát khỏi mọi lụy phiền.

Rājato vā, corato vā, manussato vā, amanussato vā, [8.934]
Thoát tai họa từ hôn quân, đạo tặc, phàm nhân, phi nhân,
Aggito vā, udakato vā, pisācato vā, khāṇukato vā, [8.554]
Hỏa hoạn, nước cuốn, ma quỷ, cây đổ,
Kaṇṭakato vā, nakkhattato vā, janapadarogato vā, asaddhammato vā, [9.516]
Vật nhọn, sao nạn, đại dịch, tà giáo,
Asandiṭṭhito vā, asappurisato vā, [5.777]
Tà kiến, hiểm nhân,
Caṇḍa hatthī assa miga goṇa kukkura ahivicchikā maṇisappa dīpi [10.524]
Voi, ngựa, hươu, bò, chó dữ, rắn, bò cạp, thủy xà, báo,
Accha taraccha sūkara mahiṃsa yakkha rakkhasādīhi, [7.120]
Gấu, linh cẩu, lợn rừng, trâu, quỷ thần, Dạ Xoa,…
Nānā bhayato vā, nānā rogato vā, [5.105]
Xin bảo vệ sanh linh, tránh khỏi bao tai họa, 
Nānā upaddavato vā, ārakkhaṃ gaṇhantu. [8.8]
Cùng bao nhiêu bệnh hoạn, và mọi điều sợ hãi.`
},

{
    id: 'MS', title: '1. Maṅgalasutta ', title_vn: '1. Kinh Phước Lành', audio: '01-Mangalasutta.mp3',
    text: `Yaṃ maṅgalaṃ dvādasahi, cintayiṃsu sadevakā; [9.582]
Những phước lành mà hàng Thiên - nhân suốt mười hai năm đã suy nghĩ,
Sotthānaṃ nādhigacchanti, aṭṭhattiṃsañca maṅgalaṃ. [7.411]
Họ cũng không biết được những điều cát tường, gồm có ba mươi tám điều phước lành,
Desitaṃ devadevena, sabbapāpavināsanaṃ; [6.680]
Đã được thuyết bởi Thiên chủ muôn Thiên (Đức Thế Tôn), nhằm hủy diệt mọi điều tội lỗi,
Sabbalokahitatthāya, maṅgalaṃ taṃ bhaṇāma he. [7.494]
và mang lại lợi lạc cho tất cả thế gian, hỡi chư hiền, hãy tụng lên những điều phước lành này,

Evaṃ me sutaṃ - ekaṃ samayaṃ bhagavā sāvatthiyaṃ viharati [8.914]
Tôi là Ananda, đã được nghe như vầy: Một thuở Đức Thế Tôn ngự ở Sa-Vát-Thí,
Jetavane anāthapiṇḍikassa ārāme. [5.858]
Tại đại tự Kỳ Viên của trưởng giả Anāthapiṇḍika (Tư-Đà Cấp-Cô-Độc),
Atha kho aññatarā devatā abhikkantāya rattiyā abhikkantavaṇṇā [9.725]
Khi đêm đã gần mãn, có Thiên tử xuất hiện với hào quang thù diệu,
Kevalakappaṃ jetavanaṃ obhāsetvā yena bhagavā tenupasaṅkami; [10.539]
Chiếu sáng cả Kỳ Viên, đi đến chỗ Thế Tôn,
Upasaṅkamitvā bhagavantaṃ abhivādetvā ekamantaṃ aṭṭhāsi. [8.684]
Rồi đảnh lễ Thế Tôn, lễ xong đứng một bên,
Ekamantaṃ ṭhitā kho sā devatā bhagavantaṃ gāthāya ajjhabhāsi: [11.690]
Đứng một bên, vị Thiên bạch Thế Tôn, bằng bài kệ như vầy:

“Bahū devā manussā ca, maṅgalāni acintayuṃ; [6.701]
Nhiều chư Thiên và nhân loại, suy nghĩ về phước lành
Ākaṅkhamānā sotthānaṃ, brūhi maṅgalamuttamaṃ”. [7.035]
Mong ước điều cát tường, xin Ngài hãy nói lên, những phước lành cao thượng. 
Asevanā ca bālānaṃ, paṇḍitānañca sevanā; [6.471]
(Thế Tôn tuỳ lời hỏi rồi giảng giải như vầy) Không kết giao kẻ ngu, thân cận người thiện trí,
Pūjā ca pūjaneyyānaṃ‚ etaṃ maṅgalamuttamaṃ. [7.077]
Kính lễ bậc đáng lễ, là phước lành cao thượng.
Patirūpadesavāso ca, pubbe ca katapuññatā; [7.056]
Ở nơi chốn thích hợp, công đức trước đã làm,
Attasammāpaṇidhi ca, etaṃ maṅgalamuttamaṃ. [6.576]
Giữ mình được tốt đẹp, là phước lành cao thượng.

Bāhusaccañca sippañca, vinayo ca susikkhito; [6.722]
Học nhiều, thực hành giỏi, thuần thục các giới điều,
Subhāsitā ca yā vācā, etaṃ maṅgalamuttamaṃ. [7.578]
Nói những lời lợi ích, là phước lành cao thượng.
Mātāpitu upaṭṭhānaṃ, puttadārassa saṅgaho; [7.494]
Phụng dưỡng mẹ và cha, chăm sóc vợ và con,
Anākulā ca kammantā, etaṃ maṅgalamuttamaṃ. [7.265]
Việc làm không lẫn lộn, là phước lành cao thượng.

Dānañca dhammacariyā ca, ñātakānañca saṅgaho; [7.494]
Bố thí, hành thiện pháp, hộ độ thân quyến thuộc,
Anavajjāni kammāni, etaṃ maṅgalamuttamaṃ. [7.327]
Hành xử không lỗi lầm, là phước lành cao thượng.
Aratī viratī pāpā, majjapānā ca saṃyamo; [7.766]
Bỏ và tránh điều ác, kiêng cữ các chất say,
Appamādo ca dhammesu, etaṃ maṅgalamuttamaṃ. [7.285]
Nỗ lực trong thiện nghiệp, là phước lành cao thượng.

Gāravo ca nivāto ca, santuṭṭhi ca kataññutā; [7.327]
Cung kính và khiêm nhường, tri túc và tri ân,
Kālena dhammassavanaṃ‚ etaṃ maṅgalamuttamaṃ. [6.868]
Đúng thời nghe chánh pháp, là phước lành cao thượng.
Khantī ca sovacassatā, samaṇānañca dassanaṃ; [6.743]
Kham nhẫn và nhu thuận, tiếp kiến các Sa Môn,
Kālena dhammasākacchā, etaṃ maṅgalamuttamaṃ. [7.452]
Đàm luận pháp tùy thời, là phước lành cao thượng.

Tapo ca brahmacariyañca, ariyasaccāna dassanaṃ; [7.118]
Tận tâm hành Phạm hạnh, tri kiến tứ Thánh đế,
Nibbānasacchikiriyā ca, etaṃ maṅgalamuttamaṃ. [7.536]
Thực chứng được Niết Bàn, là phước lành cao thượng.
Phuṭṭhassa lokadhammehi, cittaṃ yassa na kampati; [7.014]
Xúc chạm pháp thế gian, tâm không động, không sầu,
Asokaṃ virajaṃ khemaṃ, etaṃ maṅgalamuttamaṃ. [8.308]
Tự tại và vô nhiễm, là phước lành cao thượng.

Etādisāni katvāna, sabbatthamaparājitā; [7.953]
Những sở hành như vậy, bất bại ở mọi nơi,
Sabbattha sotthiṃ gacchanti, taṃ tesaṃ maṅgalamuttamaṃ. [9.781]
Mọi nơi đến cát tường, đây phước lành cao thượng.`
},

{
    id: 'Ratana', title: '2. Ratanasutta', title_vn: '2. Kinh Châu Báu', audio: '02-Ratanasutta.mp3',
    text: `Paṇidhānato paṭṭhāya tathāgatassa dasa pāramiyo, [10.128]
Đại nguyện của Như Lai, gồm mười ba-la-mật,
Dasa upapāramiyo, dasa paramatthapāramiyoti, samatiṃsa pāramiyo, [10.446]
Mười thường ba-la-mật, mười thắng ba-la-mật, đủ ba mươi pháp độ.
Pañca mahapariccāge, lokatthacariyaṃ ñātatthacariyaṃ buddhatthacariyanti tisso cariyāyo [12.642]
Năm pháp đại xả thí, và cả ba đại hạnh: đại hạnh cho thế gian, đại hạnh cho thân tộc, đại hạnh quả vị Phật,
Pacchimabhave gabbhavokkantiṃ jātiṃ abhinikkhamanaṃ padhānacariyaṃ bodhipallaṅke māravijayaṃ [14.082]
Trong kiếp chót giáng trần, xuất gia tầm giải thoát, sáu năm tu khổ hạnh, chiến thắng đại ma quân,
Sabbaññutaññāṇappativedhaṃ dhammacakkappavattanaṃ navalokuttaradhammeti [10.983]
Đạt Nhất Thiết Chủng Trí, chứng chín pháp siêu phàm, và chuyển vận Pháp luân.
Sabbepime buddhaguṇe āvajjetvā vesāliyā tīsu pākarantaresu [10.275]
Ba vòng thành Vesali, niệm tất cả ân đức,
Tiyāmarattiṃ parittaṃ karonto āyasmā ānandatthero viya kāruññacittaṃ upaṭṭhapetvā [12.325]
Tôn giả Ananda với từ tâm vô lượng, trì tụng kinh châu báu, suốt trọn cả ba canh.
Koṭīsahassesu, cakkavāḷesu devatā; [6.150]
Mười muôn triệu thế giới, chư Thiên khắp các cõi,
Yassānaṃ paṭiggaṇhanti, yañca vesāliyā pure. [7.297]
Uy lực kinh thọ trì, trong thành Vesali,
Rogāmanussadubbhikkha sambhutaṃ tividhaṃ bhayaṃ; [6.931]
Tiêu trừ mọi tai ương, đói khát và bệnh tật, cùng phi nhân quấy nhiễu,
Khippamantaradhāpesi, parittaṃ taṃ bhaṇāma he. [7.297]
Thảy đều được tan biến. Này hỡi chư hiền giả, chúng tôi sẽ tụng lên, hộ kinh châu báu ấy.

Yānīdha bhūtāni samāgatāni, bhummāni‚ vā yāni va antalikkhe. [9.494]
Phàm những sanh linh nào, đã tụ hội nơi đây, hoặc các hạng địa tiên, hay các hạng Thiên tiên,
Sabbeva bhūtā sumanā bhavantu, athopi sakkacca suṇantu bhāsitaṃ. [9.518]
Mong rằng mọi sanh linh, được đẹp ý vui lòng, rồi xin hãy thành tâm, lắng nghe lời dạy này.
Tasmā hi bhūtā nisāmetha sabbe, mettaṃ karotha mānusiyā pajāya; [9.103]
Do vậy các sanh linh, tất cả hãy lắng tâm, rồi khởi lòng từ mẫn, đối với thảy mọi loài.
Divā ca ratto ca haranti ye baliṃ, tasmā hi ne rakkhatha appamattā. [9.347]
Ban ngày và ban đêm, họ dâng lễ cúng dường, vì vậy chớ xao lãng, hãy hộ trì cho họ.

Yaṃ kiñci vittaṃ idha vā huraṃ vā, saggesu vā yaṃ ratanaṃ paṇītaṃ; [10.202]
Phàm có tài sản nào, đời này hay đời sau, hay ở tại Thiên giới, có châu báu thù thắng,
Na no samaṃ atthi tathāgatena, idampi buddhe ratanaṃ paṇītaṃ; etena saccena suvatthi hotu. [14.180]
Không gì sánh bằng được, với Như Lai Thiện Thệ. Như vậy, nơi Đức Phật, là châu báu thù diệu. Mong với sự thật này, mọi loài được hạnh phúc.

Khayaṃ virāgaṃ amataṃ paṇītaṃ, yadajjhagā sakyamunī samāhito; [9.884]
Pháp bất tử tối thượng, ly dục diệt phiền não, Đức Thích Ca Mâu Ni, có định chứng pháp này.
Na tena dhammena samatthi kiñci, idampi dhamme ratanaṃ paṇītaṃ; etena saccena suvatthi hotu. [14.570]
Không gì sánh bằng được, pháp thiền vi diệu ấy. Như vậy, nơi Chánh Pháp, có châu báu thù diệu. Mong với sự thật này, mọi loài được hạnh phúc.

Yaṃ buddhaseṭṭho parivaṇṇayī suciṃ, samādhimānantarikaññamāhu; [9.103]
Phật, Thanh Văn, Duyên Giác, nói lên lời tán thán, định thù diệu trong sạch, liên tục không gián đoạn.
Samādhinā tena samo na vijjati, idampi dhamme ratanaṃ paṇītaṃ; etena saccena suvatthi hotu. [14.277]
Không gì sánh bằng được, pháp thiền vi diệu ấy. Như vậy, nơi Chánh Pháp, có châu báu thù diệu. Mong với sự thật này, mọi loài được hạnh phúc.

Ye puggalā aṭṭha sataṃ pasatthā, cattāri etāni yugāni honti; [9.250]
Thánh tám vị bốn đôi, là những bậc Ứng Cúng, đệ tử Đấng Thiện Thệ, được trí giả tán thán,
Te dakkhiṇeyyā sugatassa sāvakā, etesu dinnāni mahapphalāni; [8.981]
Cúng dường đến các Ngài, được kết quả to lớn.
Idampi saṅghe ratanaṃ paṇītaṃ, etena saccena suvatthi hotu. [9.811]
Như vậy nơi Tăng chúng, có châu báu thù diệu, mong với sự thật này, mọi loài được hạnh phúc.

Ye suppayuttā manasā daḷhena, nikkāmino gotamasāsanamhi; [9.128]
Những vị đã ly dục, với ý thật kiên trì, đã khéo léo phụng hành, lời dạy Gotama.
Te pattipattā amataṃ vigayha, laddhā mudhā nibbutiṃ bhuñjamānā. [10.202]
Họ đạt được quả vị, họ thể nhập bất tử, hưởng thọ sự tịch tịnh.
Idampi saṅghe ratanaṃ paṇītaṃ, etena saccena suvatthi hotu. [9.689]
Như vậy nơi Tăng chúng, có châu báu thù diệu, mong với sự thật này, mọi loài được hạnh phúc.

Yathindakhīlo pathavissito siyā, catubbhi vātehi asampakampiyo. [9.713]
Ví như cột trụ đá, được chôn chặt xuống đất, dầu bốn hướng cuồng phong, cũng không hề lay động,
Tathūpamaṃ sappurisaṃ vadāmi, yo ariyasaccāni avecca passati; [8.933]
Ta nói bậc chân nhân, thấu rõ tứ Thánh đế, cũng tự tại bất động, trước tám pháp thế gian.
Idampi saṅghe ratanaṃ paṇītaṃ, etena saccena suvatthi hotu. [10.006]
Như vậy nơi Tăng chúng, có châu báu thù diệu, mong với sự thật này, mọi loài được hạnh phúc.

Ye ariyasaccāni vibhāvayanti, gambhīrapaññena sudesitāni; [8.664]
Bậc thấu triệt Thánh đế, đã được khéo thuyết giảng, bởi trí tuệ uyên thâm,
Kiñcāpi te honti bhusaṃ pamattā, na te bhavaṃ aṭṭhamamādiyanti; [9.103]
Dù cho có bất cẩn, thì cũng không bao giờ, tái sanh kiếp thứ tám.
Idampi saṅghe ratanaṃ paṇītaṃ, etena saccena suvatthi hotu. [9.909]
Như vậy nơi Tăng chúng, có châu báu thù diệu, mong với sự thật này, mọi loài được hạnh phúc.

Sahāvassa dassanasampadāya, tayassu dhammā jahitā bhavanti. [8.371]
Với đầy đủ tri kiến, Thanh Văn đạo quả tuệ, vị ấy đoạn trừ được, đồng thời ba kiết sử,
Sakkāyadiṭṭhī vicikicchitañca, sīlabbataṃ vāpi yadatthi kiñci. [9.006]
Thân kiến và hoài nghi, luôn cả giới cấm thủ.
Catūhapāyehi ca vippamutto, chaccābhiṭhānāni abhabba kātuṃ. [8.884]
Vị không thể nào phạm, sáu trọng nghiệp bất thiện, vĩnh viễn giải thoát mình, ra khỏi bốn đọa xứ.
Idampi saṅghe ratanaṃ paṇītaṃ, etena saccena suvatthi hotu. [9.836]
Như vậy nơi Tăng chúng, có châu báu thù diệu, mong với sự thật này, mọi loài được hạnh phúc.

Kiñcāpi so kamma karoti pāpakaṃ, kāyena vācā uda cetasā vā. [10.177]
Dù vô tâm phạm lỗi, bằng thân, ý hay lời,
Abhabba so tassa paṭicchadāya, abhabbatā diṭṭhapadassa vuttā. [8.615]
Đối với bậc “kiến đạo”, cũng không hề che giấu, lỗi lầm của vị ấy.
Idampi saṅghe ratanaṃ paṇītaṃ, etena saccena suvatthi hotu. [9.225]
Như vậy nơi Tăng chúng, có châu báu thù diệu, mong với sự thật này, mọi loài được hạnh phúc.

Vanappagumbe yatha phussitagge, gimhānamāse paṭhamasmiṃ gimhe. [9.030]
Đẹp là những cây rừng, đội chồi non đầu ngọn, trong tháng hạ nóng bức, những ngày hạ đầu tiên.
Tathūpamaṃ dhammavaraṃ adesayi, nibbānagāmiṃ paramaṃ hitāya. [8.396]
Pháp thù thắng Phật thuyết, được ví dụ như vậy, Pháp đưa đến Niết Bàn, Pháp lợi ích tối thượng.
Idampi buddhe ratanaṃ paṇītaṃ, etena saccena suvatthi hotu. [9.421]
Như vậy nơi Đức Phật, là châu báu thù diệu, mong với sự thật này, mọi loài được hạnh phúc.

Varo varaññū varado varāharo, anuttaro dhammavaraṃ adesayi; [8.298]
Đức Phật Bậc vô thượng, liễu thông Pháp vô thượng, ban bố Pháp vô thượng, chuyển đạt pháp vô thượng, tuyên thuyết Pháp vô thượng.
Idampi buddhe ratanaṃ paṇītaṃ, etena saccena suvatthi hotu. [9.323]
Như vậy nơi Đức Phật, là châu báu thù diệu, mong với sự thật này, mọi loài được hạnh phúc.

Khīṇaṃ purāṇaṃ nava natthi sambhavaṃ, virattacittāyatike bhavasmiṃ; [9.713]
Nghiệp cũ đã đoạn tận, nghiệp mới không sanh khởi, tâm tư không kiết sử, trong sanh hữu tương lai.
Te khīṇabījā avirūḷhichandā, nibbanti dhīrā yathāyaṃ padīpo. [9.543]
Bởi tham muốn đã đoạn, các chủng tử không còn, ví như ngọn đèn tắt, bậc trí chứng Niết Bàn.
Idampi saṅghe ratanaṃ paṇītaṃ, etena saccena suvatthi hotu. [9.445]
Như vậy nơi Tăng chúng, là châu báu thù diệu, mong với sự thật này, mọi loài được hạnh phúc.

Yānīdha bhūtāni samāgatāni, bhummāni vā yāni va antalikkhe; [9.177]
Phàm những sanh linh nào, đã tụ hội nơi đây, hoặc trên mặt đất này, hoặc chính giữa hư không,
Tathāgataṃ devamanussapūjitaṃ, buddhaṃ namassāma suvatthi hotu. [9.152]
Hãy đảnh lễ Đức Phật, đã như thực xuất hiện, được loài trời loài người, đảnh lễ và cúng dường, mong với sự thật này, mọi loài được hạnh phúc.

Yānīdha bhūtāni samāgatāni, bhummāni vā yāni va antalikkhe; [9.128]
Phàm những sanh linh nào tụ hội nơi đây, hoặc trên mặt đất hoặc giữa hư không,
Tathāgataṃ devamanussapūjitaṃ, dhammaṃ namassāma suvatthi hotu. [8.566]
Hãy đảnh lễ Chánh Pháp, đã như thực xuất hiện, được loài trời loài người, đảnh lễ và cúng dường, mong với sự thật này, mọi loài được hạnh phúc.

Yānīdha bhūtāni samāgatāni, bhummāni vā yāni va antalikkhe; [9.274]
Phàm những sanh linh nào tụ hội nơi đây, hoặc trên mặt đất hoặc giữa hư không,
Tathāgataṃ devamanussapūjitaṃ, saṅghaṃ namassāma suvatthi hotu. [10.500]
Hãy đảnh lễ Chúng Tăng, đã như thực xuất hiện, được loài trời loài người, đảnh lễ và cúng dường, mong với sự thật này, mọi loài được hạnh phúc.`
},

{
    id: 'Metta', title: '3. Mettasutta', title_vn: '3. Kinh Lòng Từ', audio: '03-Mettasutta.mp3',
    text: `Yassānubhāvato yakkhā, nevadassenti bhīsanaṃ; [10.475]
Nhờ uy lực kinh này, khiến những loài Dạ Xoa, không hiện hình ghê sợ.
Yamhi cevānuyuñjanto, rattindivamatandito. [7.643]
Những ai ngày và đêm, thường siêng năng tụng trì,
Sukhaṃ supati sutto ca, pāpaṃ kiñci na passati; [7.061]
Ngủ ngon, không ác mộng
Evamādi guṇūpetaṃ, parittaṃ taṃ bhaṇāma he. [8.419]
Này hỡi các tôn giả, xin chư vị lắng nghe, chúng tôi sẽ tụng lên, hộ kinh lòng từ này.

Karaṇīyamatthakusalena, yanta santaṃ padaṃ abhisamecca; [8.186]
Hiền nhân cầu an lạc, nên huân tu pháp lành,
Sakko ujū ca suhujū ca, suvaco cassa mudu anatimānī. [8.768]
Có nghị lực chân chất, ngay thẳng và nhu thuận, hiền hòa không kiêu mạn.
Santussako ca subharo ca, appakicco ca sallahukavutti; [7.565]
Sống dễ dàng tri túc, thanh đạm không rộn ràng.
Santindriyo ca nipako ca, appagabbho kulesvananugiddho. [8.419]
Lục căn luôn trong sáng, trí tuệ càng hiển minh, tự trọng không quyến niệm,

Na ca khuddamācare kiñci, yena viññū pare upavadeyyuṃ; [8.846]
Không làm việc ác nhỏ, mà bậc trí hiền chê.
Sukhino va khemino hontu, sabbasattā bhavantu sukhitattā. [8.807]
Nguyện thái bình an lạc, nguyện tất cả sanh linh, tràn đầy muôn hạnh phúc.
Ye keci pāṇabhūtatthi, tasā vā thāvarā vanavasesā; [8.419]
Với muôn loài chúng sanh, không phân phàm hay Thánh,
Dīghā vā yeva mahantā, majjhimā rassakā aṇukathūlā. [8.419]
Lớn nhỏ hoặc trung bình, thấp cao hay dài ngắn, tế thô không đồng đẳng.

Diṭṭhā vā yeva adiṭṭhā, ye va dūre vasanti avidūre. [8.380]
Hữu hình hoặc vô hình, gần xa không kể xiết
Bhūtā va sambhavesī va, sabbasattā bhavantu sukhitattā. [8.264]
Đã sanh hoặc chưa sanh, nguyện tất cả sanh linh, tràn đầy muôn hạnh phúc.
Na paro paraṃ nikubbetha, nātimaññetha katthaci na kiñci‚ [8.264]
Đừng làm hại lẫn nhau, chớ khinh rẻ người nào, ở bất cứ nơi đâu,
Byārosanā paṭighasaññā, nāññamaññassa dukkhamiccheyya. [8.186]
Đừng vì niệm sân si, hoặc hiềm hận trong lòng, mà mong người đau khổ.

Mātā yathā niyaṃ puttamāyusā ekaputtamanurakkhe; [8.225]
Hãy mở rộng tình thương, hy sinh như từ mẫu, suốt đời lo che chở, đứa con một của mình.
Evampi sabbabhūtesu, mānasaṃ bhāvaye aparimāṇaṃ. [8.341]
Hãy phát tâm vô lượng, đến tất cả sanh linh.
Mettañca sabbalokasmi, mānasaṃ bhāvaye aparimāṇaṃ; [7.837]
Từ bi gieo cùng khắp, cả thế gian khổ hải,
Uddhaṃ adho ca tiriyañca, asambādhaṃ averamasapattaṃ. [9.040]
Trên dưới và quanh mình, không hẹp hòi oan trái, không hờn giận căm thù.

Tiṭṭhaṃ caraṃ nisinno va, sayāno yāvatāssa vitamiddho‚ [8.147]
Khi đi đứng ngồi nằm, bao giờ còn tỉnh thức,
Etaṃ satiṃ adhiṭṭheyya, brahmametaṃ vihāramidhamāhu. [8.807]
An trú chánh niệm này, Phạm hạnh chính là đây.
Diṭṭhiñca anupaggamma, sīlavā dassanena sampanno; [7.682]
Ai từ bỏ kiến chấp, khéo nghiêm trì giới hạnh, thành tựu được chánh trí,
Kāmesu vineyya gedhaṃ, na hi jātuggabbhaseyya punareti. [11.709]
Không ái nhiễm dục trần, không còn thai sanh nữa.`
},

{
    id: 'Khandha', title: '4. Khandhasutta', title_vn: '4. Hộ Kinh Khandha', audio: '04-Khandhasutta.mp3',
    text: `Sabbāsīvisajātīnaṃ, dibbamantāgadaṃ viya; [10.975]
Này hỡi các hiền giả, như một món Thiên dược, như bài linh chú hay,
Yaṃ nāseti visaṃ ghoraṃ, sesañcāpi parissayaṃ. [7.946]
Khiến cho các nọc độc, hay những lúc nguy nan, từ thú dữ, độc trùng,
Aṇākkhettamhi sabbattha, sabbadā sabbapāṇinaṃ; [7.499]
Trong tất cả cõi giới, gây hại đến chúng sanh,
Sabbassopi nivāreti, parittaṃ taṃ bhaṇāma he. [7.896]
thời nhanh chóng vô hiệu, chúng tôi sẽ tụng lên, hộ kinh Khandha này,

Virūpakkhehi me mettaṃ, mettaṃ erāpathehi me; [7.300]
Rải tâm từ của tôi, đến với dòng rắn chúa, tên Vi-rù-pak-kha, rải tâm từ của tôi, đến với dòng rắn chúa, tên E-rà-pa-tha.
Chabyāputtehi me mettaṃ, mettaṃ kaṇhāgotamakehi ca. [8.095]
Rải tâm từ của tôi, đến với dòng rắn chúa, tên Chab-yà-put-ta, rải tâm từ của tôi, đến với dòng rắn chúa, Kan-hà-go-ta-ma.

Apādakehi me mettaṃ, mettaṃ dvipādakehi me. [7.002]
Rải tâm từ của tôi đến chúng sinh không chân, rải tâm từ của tôi đến chúng sinh hai chân.
Catuppadehi me mettaṃ, mettaṃ bahuppadehi me. [6.654]
Rải tâm từ của tôi đến chúng sinh bốn chân, rải tâm từ của tôi đến chúng sinh nhiều chân.

Mā maṃ apādako hiṃsi, mā maṃ hiṃsi dvipādako [7.052]
Loài chúng sinh không chân, xin đừng làm khổ tôi, loài chúng sinh hai chân, xin đừng làm khổ tôi. 
Mā maṃ catuppado hiṃsi, mā maṃ hiṃsi bahuppado. [7.548]
Loài chúng sinh bốn chân, xin đừng làm khổ tôi, loài chúng sinh nhiều chân, xin đừng làm khổ tôi. 

Sabbe sattā sabbe pāṇā, sabbe bhūtā ca kevalā; [8.045]
Tôi xin rải tâm từ, đến tất cả chúng sinh, tất cả mọi sinh mạng, mọi chúng sinh hiện hữu.
Sabbe bhadrāni passantu, mā kañci pāpamāgamā. [7.995]
Tất cả chúng sinh ấy, thấy những cảnh tốt đẹp, cầu mong không một ai, gặp phải cảnh khổ đau.

Appamāṇo buddho, appamāṇo dhammo; appamāṇo saṅgho, [8.194]
Ân đức Phật vô lượng, Ân đức Pháp vô lượng, Ân đức Tăng vô lượng
Pamāṇavantāni sarīsapāni; ahivicchikā satapadī, uṇṇanābhī sarabū mūsikā. [12.316]
Rắn, bò cạp, rết, nhện, tắc kè, chuột, vân vân. Các loài bò sát ấy, có tính hay hung dữ,

Katā me rakkhā katā me parittā paṭikkamantu bhūtāni. [8.492]
Tôi có nơi hộ trì, tôi có nơi bảo hộ, xin tất cả chúng sinh, tránh xa đừng hại tôi.
Sohaṃ namo bhagavato, namo sattannaṃ sammāsambuddhānaṃ. [10.952]
Con đảnh lễ Chư Phật, hiện tại đến quá khứ, bảy Đức Phật Chánh Giác.`
},

{
    id: 'Mora', title: '5. Morasutta', title_vn: '5. Kinh Khổng Tước', audio: '05-Morasutta.mp3',
    text: `Pūrentaṃ bodhisambhāre, nibbattaṃ morayoniyaṃ; [10.284]
Vào thời bổ túc các pháp độ, Bồ Tát sanh làm loài khổng tước;
Yena saṃvihitārakkhaṃ, mahāsattaṃ vanecarā. [6.639]
Bậc đại sỹ sinh sống ở trong rừng, nhờ bài chú này được bảo vệ.
Cirassaṃ vāyamantāpi, neva sakkhiṃsu gaṇhituṃ; [6.466]
Bảy đời thợ săn dù nỗ lực cũng không thể bắt được khổng tước.
“Brahmamantan”ti akkhātaṃ, parittaṃ taṃ bhaṇāma he. [7.551]
Này chư hiền, hãy tụng bài hộ kinh, được cho là bài chú của Phạm Thiên.

Udetayaṃ cakkhumā ekarājā, harissavaṇṇo pathavippabhāso; [9.048]
Vị vua duy nhất cho mắt này đang mọc lên, với sắc màu vàng chói, chiếu sáng cả đất liền;
Taṃ taṃ namassāmi harissavaṇṇaṃ pathavippabhāsaṃ, tayājja guttā viharemu divasaṃ. [11.087]
Vậy ta đảnh lễ Ngài, vị sáng soi mặt đất, nhờ Ngài bảo hộ ta, sống an toàn trọn ngày.
Ye brāhmaṇā vedagū sabbadhamme, te me namo te ca maṃ pālayantu; [9.135]
Các vị Thánh, chân nhân, bậc tuệ tri mọi pháp, con đảnh lễ các Ngài, hãy hộ trì cho con.
Namatthu buddhānaṃ namatthu bodhiyā, namo vimuttānaṃ namo vimuttiyā; [9.221]
Đảnh lễ chư Phật-Đà, đảnh lễ Bồ-Đề vị, đảnh lễ bậc giải thoát, đảnh lễ giải thoát vị.
Imaṃ so parittaṃ katvā, moro carati esanā. [7.572]
Sau khi đọc lên chú bảo hộ này, chim khổng tước đi kiếm mồi.

Apetayaṃ cakkhumā ekarājā, harissavaṇṇo pathavippabhāso; [8.288]
Vị vua duy nhất cho mắt này đang lặn mất, với sắc màu vàng chói, chiếu sáng cả đất liền;
Taṃ taṃ namassāmi harissavaṇṇaṃ pathavippabhāsaṃ, tayājja guttā viharemu rattiṃ. [10.436]
Vậy ta đảnh lễ Ngài, vị sáng soi mặt đất, nhờ Ngài bảo vệ ta, sống an toàn trọn đêm.
Ye brāhmaṇā vedagū sabbadhamme, te me namo te ca maṃ pālayantu; [8.787]
Chư vị Thánh, chân nhân, bậc tuệ tri mọi pháp, con đảnh lễ các Ngài, hãy hộ trì cho con.
Namatthu buddhānaṃ namatthu bodhiyā, namo vimuttānaṃ namo vimuttiyā; [9.004]
Đảnh lễ chư Phật-Đà, đảnh lễ Bồ-Đề vị, đảnh lễ bậc giải thoát, đảnh lễ giải thoát vị.
Imaṃ so parittaṃ katvā, moro vāsamakappayi. [7.925]
Sau khi đọc lên chú bảo hộ này, chim khổng tước đi ngủ.`
},

 
 
{
    id: 'Vaṭṭa', title: '6. Vaṭṭasutta', title_vn: '6. Kinh Chim Cút', audio: '06-Vattasutta.mp3',
    text: `Pūrentaṃ bodhisambhāre, nibbattaṃ vaṭṭajātiyaṃ; [10.597]
Vào thời bổ túc các pháp độ, Bồ Tát tái sanh làm chim cút;
Yassa tejena dāvaggi, mahāsattaṃ vivajjayi. [6.696]
Thông qua uy lực của kinh này, Đại sỹ thoát được ngọn lửa rừng.
Therassa Sāriputtassa, lokanāthena bhāsitaṃ; [6.172]
Do duyên ngài Xá Lợi Phất hỏi, Đức Thế Tôn đã thuyết bài kinh;
Kappaṭṭhāyiṃ mahātejaṃ, parittaṃ taṃ bhaṇāma he. [7.492]
Có uy lực trụ đến mãn kiếp, ta hãy cùng tụng hộ kinh này:

Atthi loke sīlaguṇo, saccaṃ soceyyanuddayā; [6.774]
Ở đời có giới đức, chân thật, tịnh, từ bi;
Tena saccena kāhāmi, saccakiriyamuttamaṃ. [6.327]
Chính với chân thật ấy, ta sẽ làm một hạnh, hạnh chân thật vô thượng.
Avajjetvā dhammabalaṃ, saritvā pubbake jine; [6.289]
Rồi hướng niệm pháp lực, niệm chư Phật quá khứ;
Saccabalamavassāya, saccakiriyamakāsahaṃ. [6.677]
Dựa sức mạnh chân thật, ta làm hạnh chân thật.

Santi pakkhā apatanā, santi pādā avañcanā; [6.735]
Có cánh không bay được, có chân không thể đi;
Mātāpitā ca nikkhantā, jātaveda paṭikkama [6.871]
Cha mẹ đã bỏ ta, hỡi lửa, hãy lui đi!
Saha sacce kate mayhaṃ, mahāpajjalito sikhī; [6.890]
Ta làm hạnh chân thật, màn lửa lớn lửa ngọn;
Vajjesi soḷasakarīsāni, udakaṃ patvā yathā sikhī; [7.880]
Đi lui mười sáu tầm, như ngọn đuốc gặp nước.
Saccena me samo natthi, esā me saccapāramī. [7.922]
Không ai sánh kịp ta, hạnh chân thật hoàn hảo.`
},

{
    id: 'Dhajagga', title: '7. Dhajaggasutta', title_vn: '7. Kinh Đầu Lá Cờ', audio: '07-Dhajaggasutta.mp3',
    text: `Yassānussaranenāpi, antalikkhepi pāṇino. [8.263]
Chỉ mới nghĩ đến bài hộ kinh này, mà các chúng sanh trong khắp các phương, ở trong hư không
Patiṭṭhamadhigacchanti, bhūmiyaṃ viya sabbathā. [6.225]
Cũng như trên đất, đều được hộ trì
Sabbupaddavajālamhā, yakkhacorādisambhavā; [6.442]
Thoát lưới tai ương, từ cướp, dạ xoa.., vô số không xuể,
Gaṇanā na ca muttānaṃ, parittaṃ taṃ bhaṇāma he. [8.308]
Chư hiền, chúng ta hãy tụng lên Hộ Kinh này.

Evaṃ me sutaṃ - ekaṃ samayaṃ bhagavā sāvatthiyaṃ viharati. [8.199]
Tôi được nghe như vầy - Một thời Đức Thế Tôn trú ở Sāvatthi,
Jetavane anāthapiṇḍikassa ārāme. [5.640]
Jetavana, tại vườn ông Anāthapiṇḍika.
Tatra kho bhagavā bhikkhū āmantesi: “bhikkhavo”ti. [6.269]
Rồi Thế Tôn gọi các Tỳ-khưu: "- Này các Tỳ-khưu."
“Bhadante”ti te bhikkhū bhagavato paccassosuṃ. Bhagavā etadavoca: [9.588]
"- Thưa vâng, bạch Thế Tôn." Các Tỳ-khưu ấy vâng đáp Thế Tôn. Thế Tôn nói như sau:

“Bhūtapubbaṃ, bhikkhave, devāsurasaṅgāmo samupabyūḷho ahosi. [9.110]
“Thuở xưa, này các Tỳ-khưu, đã xảy ra một cuộc chiến dữ dội khởi lên giữa chư Thiên và các Asūra.
Atha kho, bhikkhave, sakko devānamindo deve tāvatiṃse āmantesi [9.436]
Rồi này các Tỳ-khưu, Thiên chủ Sakka gọi chư Thiên ở Tam thập tam thiên:
‘Sace, mārisā, devānaṃ saṅgāmagatānaṃ [5.705]
"- Này thân hữu, khi các Ông lâm chiến,
Uppajjeyya bhayaṃ vā chambhitattaṃ vā lomahaṃso vā, [7.050]
nếu sợ hãi, hoảng hốt hay lông tóc dựng ngược có khởi lên;
Mameva tasmiṃ samaye dhajaggaṃ ullokeyyātha. [6.356]
khi ấy, các Ông hãy nhìn nơi đầu ngọn cờ của ta.
Mamaṃ hi vo dhajaggaṃ ullokayataṃ [5.293]
Khi các Ông nhìn lên đầu ngọn cờ của ta,
Yaṃ bhavissati bhayaṃ vā chambhitattaṃ vā lomahaṃso vā, so pahīyissati. [8.980]
thì sợ hãi, hoảng hốt hay lông tóc dựng ngược sẽ tiêu diệt.

No ce me dhajaggaṃ ullokeyyātha, atha pajāpatissa devarājassa dhajaggaṃ ullokeyyātha. [10.390]
Nếu các Ông không ngó lên đầu ngọn cờ của ta, thì hãy ngó lên đầu ngọn cờ của Thiên vương Pajāpati.
Pajāpatissa hi vo devarājassa dhajaggaṃ ullokayataṃ [6.941]
Khi các Ông ngó lên đầu ngọn cờ của Thiên vương Pajāpati,
Yaṃ bhavissati bhayaṃ vā chambhitattaṃ vā lomahaṃso vā, so pahīyissati. [8.503]
thì sợ hãi, hoảng hốt hay lông tóc dựng ngược có khởi lên, cũng sẽ tiêu diệt.

No ce pajāpatissa devarājassa dhajaggaṃ ullokeyyātha, [6.659]
Nếu các Ông không ngó lên đầu ngọn cờ của Thiên vương Pajāpati,
Atha varuṇassa devarājassa dhajaggaṃ ullokeyyātha. [6.139]
hãy ngó lên đầu ngọn cờ của Thiên vương Varuṇa.
Varuṇassa hi vo devarājassa dhajaggaṃ ullokayataṃ [6.681]
Khi các Ông ngó lên đầu ngọn cờ của Thiên vương Varuṇa,
Yaṃ bhavissati bhayaṃ vā chambhitattaṃ vā lomahaṃso vā, so pahīyissati. [9.436]
thì sợ hãi, hoảng hốt hay lông tóc dựng ngược có khởi lên cũng sẽ tiêu diệt.

No ce varuṇassa devarājassa dhajaggaṃ ullokeyyātha, [6.312]
Nếu các Ông không ngó lên đầu ngọn cờ của Thiên vương Varuṇa,
Atha īsānassa devarājassa dhajaggaṃ ullokeyyātha. [6.030]
hãy ngó lên đầu ngọn cờ của Thiên vương Isāna.
Īsānassa hi vo devarājassa dhajaggaṃ ullokayataṃ [6.898]
Khi các Ông ngó lên đầu ngọn cờ của Thiên vương Isāna,
Yaṃ bhavissati bhayaṃ vā chambhitattaṃ vā lomahaṃso vā, so pahīyissatī’ti. [9.327]
thì sợ hãi, hoảng hốt hay lông tóc dựng ngược có khởi lên, cũng sẽ tiêu diệt."

Taṃ kho pana, bhikkhave, sakkassa vā devānamindassa dhajaggaṃ ullokayataṃ, [8.742]
Này các Tỳ-khưu, khi họ nhìn lên đầu ngọn cờ của Thiên chủ Sakka,
Pajāpatissa vā devarājassa dhajaggaṃ ullokayataṃ, [6.139]
hay khi họ nhìn lên đầu ngọn cờ của Thiên vương Pajāpati,
Varuṇassa vā devarājassa dhajaggaṃ ullokayataṃ, [6.182]
hay khi họ nhìn lên đầu ngọn cờ của Thiên vương Varuṇa,
Īsānassa vā devarājassa dhajaggaṃ ullokayataṃ [6.247]
hay khi họ nhìn lên đầu ngọn cờ của Thiên vương Isāna,
Yaṃ bhavissati bhayaṃ vā chambhitattaṃ vā lomahaṃso vā, [6.442]
thì sợ hãi, hoảng hốt hay lông tóc dựng ngược được khởi lên,
So pahīyethāpi nopi pahīyetha. Taṃ kissa hetu? [6.312]
có thể sẽ biến mất hoặc sẽ không biến mất. Vì cớ sao?
Sakko hi, bhikkhave, devānamindo avītarāgo avītadoso avītamoho [9.284]
Vì Thiên chủ Sakka chưa đoạn diệt tham, chưa đoạn diệt sân, chưa đoạn diệt si,
Bhīru chambhī utrāsī palāyīti. [5.358]
còn nhát gan, hoảng hốt, hoảng sợ, hoảng chạy.

Ahañca kho, bhikkhave, evaṃ vadāmi ‘sace tumhākaṃ, bhikkhave, [7.332]
Và này các Tỳ-khưu, Ta nói như sau: Này các Tỳ-khưu, khi các ông
Araññagatānaṃ vā rukkhamūlagatānaṃ vā suññāgāragatānaṃ vā [7.418]
đi vào rừng, đi đến gốc cây hay đi đến nhà trống,
Uppajjeyya bhayaṃ vā chambhitattaṃ vā lomahaṃso vā, [6.247]
nếu run sợ, hoảng hốt, hay lông tóc dựng ngược có khởi lên,
Mameva tasmiṃ samaye anussareyyātha [5.163]
trong khi ấy hãy chỉ nhớ đến Như lai như vầy:

‘Itipi so bhagavā arahaṃ sammāsambuddho [6.182]
Ngài là Thế Tôn, Ứng Cúng, Chánh Biến Tri,
Vijjācaraṇasampanno sugato lokavidū [5.726]
Minh Hạnh Túc, Thiện Thệ, Thế Gian Giải,
Anuttaro purisadammasārathi satthā devamanussānaṃ buddho bhagavā’ti. [10.108]
Vô Thượng Sĩ, Điều Ngự Trượng Phu, Thiên Nhân Sư, Phật, Thế Tôn.
Mamaṃ hi vo, bhikkhave, anussarataṃ [4.685]
Vì rằng, này các Tỳ-khưu, khi các ông nhớ đến Ta,
Yaṃ bhavissati bhayaṃ vā chambhitattaṃ vā lomahaṃso vā, so pahīyissati. [8.742]
thì sợ hãi, hoảng hốt hay lông tóc dựng ngược sẽ tiêu diệt.

No ce maṃ anussareyyātha, atha dhammaṃ anussareyyātha [6.681]
Nếu các Ông không nhớ đến Ta, hãy nhớ đến Giáo Pháp:
‘Svākkhāto bhagavatā dhammo [4.165]
Ðây là Pháp do Thế Tôn khéo thuyết,
Sandiṭṭhiko akāliko ehipassiko opaneyyiko [7.505]
Thiết thực hiện tại, cho quả lập tức, đến để mà thấy, có khả năng hướng thượng,
Paccattaṃ veditabbo viññūhī’ti. [4.924]
Do người trí tự mình kinh nghiệm.
Dhammaṃ hi vo, bhikkhave, anussarataṃ [4.620]
Vì rằng, này các Tỳ-khưu, khi các ông nhớ đến Giáo Pháp,
Yaṃ bhavissati bhayaṃ vā chambhitattaṃ vā lomahaṃso vā, so pahīyissati. [8.676]
thì sợ hãi, hoảng hốt hay lông tóc dựng ngược sẽ tiêu diệt.

No ce dhammaṃ anussareyyātha, atha saṅghaṃ anussareyyātha [7.136]
Nếu các Ông không nhớ đến Giáo Pháp, hãy nhớ đến Chúng Tăng:
‘Suppaṭipanno bhagavato sāvakasaṅgho [4.967]
Thực hành thiện lành là chúng Tăng đệ tử Đức Thế Tôn,
Ujuppaṭipanno bhagavato sāvakasaṅgho [4.967]
Thực hành ngay thẳng là chúng Tăng đệ tử Đức Thế Tôn,
Ñāyappaṭipanno bhagavato sāvakasaṅgho [5.141]
Ứng lý thực hành là chúng Tăng đệ tử Đức Thế Tôn,
Sāmīcippaṭipanno bhagavato sāvakasaṅgho, [5.488]
Cung kính thực hành là chúng Tăng đệ tử Đức Thế Tôn,
Yadidaṃ cattāri purisayugāni aṭṭha purisapuggalā [6.399]
Tức là bốn đôi, tám chúng.
Esa bhagavato sāvakasaṅgho, [4.056]
Chúng Tăng đệ tử này của Đức Thế Tôn
Āhuneyyo pāhuneyyo dakkhiṇeyyo añjalikaraṇīyo [7.397]
Đáng được tôn trọng, đáng được tiếp rước, đáng được cúng dường, đáng được chấp tay,
Anuttaraṃ puññakkhettaṃ lokassā’ti. [4.881]
Là vô thượng phước điền ở trên đời.

Saṅghaṃ hi vo, bhikkhave, anussarataṃ [4.382]
Vì rằng, này các Tỳ-khưu, khi các ông nhớ đến Chúng Tăng,
Yaṃ bhavissati bhayaṃ vā chambhitattaṃ vā lomahaṃso vā, so pahīyissati. [8.416]
thì sợ hãi, hoảng hốt hay lông tóc dựng ngược sẽ tiêu diệt.
Taṃ kissa hetu? Tathāgato hi, bhikkhave, arahaṃ sammāsambuddho [7.223]
Vì cớ sao? Vì Như Lai, này các Tỳ-khưu, là bậc A-la-hán, Chánh Biến Tri,
Vītarāgo vītadoso vītamoho abhīru acchambhī anutrāsī apalāyī”ti. [11.258]
Đã ly tham, ly sân, ly si, không nhát gan, không hoảng hốt, không hoảng sợ, không hoảng chạy.”

Idamavoca bhagavā. Idaṃ vatvāna sugato athāparaṃ etadavoca satthā [9.327]
Thế Tôn nói như vậy, Thiện Thệ nói vậy xong, bậc Ðạo Sư nói tiếp:
“Araññe rukkhamūle vā, suññāgāreva bhikkhavo; [6.074]
Này các vị Tỳ-khưu, trong rừng hay gốc cây, hay tại căn nhà trống;
Anussaretha sambuddhaṃ, bhayaṃ tumhāka no siyā. [6.182]
Hãy niệm Bậc Chánh Giác, các ông có sợ hãi, sợ hãi sẽ tiêu diệt;
“No ce buddhaṃ sareyyātha, lokajeṭṭhaṃ narāsabhaṃ; [6.182]
Nếu không tư niệm Phật, tối thượng chủ ở đời, và cũng là Ngưu vương, trong thế giới loài người;
Atha dhammaṃ sareyyātha, niyyānikaṃ sudesitaṃ. [6.507]
Vậy hãy tư niệm Pháp, hướng thượng, khéo tuyên thuyết.
“No ce dhammaṃ sareyyātha, niyyānikaṃ sudesitaṃ; [6.421]
Nếu không tư niệm Pháp, hướng thượng, khéo tuyên thuyết;
Atha saṅghaṃ sareyyātha, puññakkhettaṃ anuttaraṃ. [6.421]
Vậy hãy tư niệm Tăng, là phước điền vô thượng.
“Evaṃ buddhaṃ sarantānaṃ, dhammaṃ saṅghañca bhikkhavo; [7.136]
Vậy này các Tỳ-khưu, như vậy tư niệm Phật, tư niệm Pháp và Tăng;
Bhayaṃ vā chambhitattaṃ vā, lomahaṃso na hessati. [8.705]
Sợ hãi hay hoảng hốt, hay lông tóc dựng ngược, không bao giờ khởi lên.`
},

{
    id: 'Āṭānāṭiya', title: '8. Āṭānāṭiyasutta', title_vn: '8. Kinh Āṭānāṭiya', audio: '08-Atanatiyasutta.mp3',
    text: `Appasannehi Nāthassa, sāsane sādhusammate; [11.791]
Vì khiến kẻ vô tín, phải tôn kính Phật Pháp;
Amanussehi caṇḍehi, sadā kibbisakāribhi. [7.675]
Hàng phi nhân tàn ác, những ai hay phạm tội.
Parisānaṃ catassannaṃ, ahiṃsāya ca guttiyā; [7.397]
Khiến hộ trì vô hại, cho bốn đôi Tăng chúng;
Yaṃ desesi Mahāviro, parittaṃ taṃ bhaṇāma he. [8.115]
Chúng ta hãy tụng lên, kinh của Đấng Đại Hùng.

Vipassissa ca namatthu, cakkhumantassa sirīmato; [6.407]
Ðảnh lễ Vipassī, sáng suốt và huy hoàng!
Sikhissapi ca namatthu, sabbabhūtānukampino. [6.220]
Ðảnh lễ Đấng Sikhī, có lòng thương muôn loài!
Vessabhussa ca namatthu, nhātakassa tapassino; [5.799]
Ðảnh lễ Vessabha, thanh tịnh, tu khổ hạnh!
Namatthu kakusandhassa, mārasenāpamaddino. [6.361]
Ðảnh lễ Kakusandha, vị nhiếp phục ma quân!
Koṇāgamanassa namatthu, brāhmaṇassa vusīmato; [6.155]
Ðảnh lễ Koṇāgamana, Bà-la-môn viên mãn!
Kassapassa ca namatthu, vippamuttassa sabbadhi. [5.753]
Ðảnh lễ Kassapa, vị giải thoát muôn mặt!
Aṅgīrasassa namatthu, sakyaputtassa sirīmato; [6.314]
Ðảnh lễ Angīrasa, vị Thích tử huy hoàng,
Yo imaṃ dhammaṃ desesi, sabbadukkhāpanūdanaṃ. [7.389]
Đã thuyết chân diệu pháp, diệt trừ mọi khổ đau!

Ye cāpi nibbutā loke, yathābhūtaṃ vipassisuṃ; [7.226]
Ai yểm ly thế giới, nhìn đời đúng như chân;
Te janā apisuṇātha mahantā vītasāradā. [6.828]
Vị ấy không hai lưỡi, bậc vĩ đại thanh thoát.
Hitaṃ devamanussānaṃ yaṃ namassanti Gotamaṃ; [6.477]
Cùng đảnh lễ Gotama, lo an lạc nhân thiên;
Vijjācaraṇasampannaṃ mahantaṃ vītasāradaṃ. [6.618]
Trì giới đức viên mãn, bậc vĩ đại thanh thoát!

Ete caññe ca sambuddhā, anekasatakoṭiyo; [6.828]
Ngài cùng chư Chánh Giác, ngàn vạn vị như thế;
Sabbe Buddhā samasamā, sabbe Buddhā mahiddhikā. [6.805]
Tất cả lực chư Phật, thảy tương đồng như nhau.
Sabbe dasabalūpetā, vesārajjehupāgatā; [6.384]
Chư Phật có mười lực, đạt đến nơi không sợ;
Sabbe te paṭijānanti, āsabhaṃ ṭhānamuttamaṃ. [6.898]
Các Ngài đều tuyên thuyết, nơi tối thượng Ngưu Vương.
Sīhanādaṃ nadantete, parisāsu visāradā; [6.244]
Các Ngài giữa hội chúng, rống lên tiếng sư tử;
Brahmacakkaṃ pavattenti, loke appaṭivattiyaṃ. [6.477]
Chuyển vận tại thế gian, bánh xe Pháp bất thối.

Upetā Buddha dhammehi, aṭṭhārasahi nāyakā; [6.477]
Các Đức Đạo Sư ấy, đủ mười tám Pháp Phật;
Bāttiṃsalakkhaṇupeta, sītānubyañjanādharā. [6.968]
Ba mươi hai tướng tốt, cùng tám mươi tướng phụ.
Byāmappabhāya suppabhā, sabbe te munikuñjarā; [6.992]
Hào quang tỏa một tầm, các Ngài dòng Mâu-Ni;
Buddhā sabbaññuno ete, sabbe khīṇāsavā jinā. [7.343]
Bậc có tất cả trí, đã chiến thắng, lậu tận.
Mahāpabhā mahātejā, mahāpaññā mahabbalā; [6.454]
Sáng ngời uy lực lớn, trí tuệ cùng từ bi;
Mahākāruṇikā dhīrā, sabbesānaṃ sukhāvahā. [6.688]
Lực ấy lớn rộng khắp, các vị Đấng phúc lành!

Dīpā nāthā patiṭṭhā ca, tāṇā leṇā ca pāṇinaṃ; [7.039]
Là hải đảo lánh nạn, là dòng tộc đại an;
Gatī bandhu mahassāsā, saraṇā ca hitesino. [7.647]
Là nơi dừng nhiêu ích, chúng sanh quay về nương.
Sadevakassa lokassa, sabbe ete parāyaṇā; [6.781]
Các Đức Phật đều là, nơi nhân Thiên nương tựa.
Tesāhaṃ sirasā pāde, vandāmi purisuttame. [7.460]
Con đê đầu lễ kính, dưới chân bậc Thượng Sĩ.

Vacasā manasā ceva, vandāmete Tathāgate; [6.665]
Thông qua ý cùng lời, lễ kính chư Như Lai;
Sayane āsane ṭhāne, gamane cāpi sabbadā. [6.898]
Trong tất cả mọi thời, đi, đứng hay nằm ngồi.
Sadā sukkhena rakkhantu, Buddhā santikarā tuvaṃ; [6.594]
Nguyện chư Phật tịch tịnh, gia hộ con bình an;
Tehi tvaṃ rakkhito santo, mutto sabbabhayehi ca. [7.202]
Nguyện các Ngài bảo hộ, con thoát điều sợ hãi.
Sabbarogā vinīmutto, sabbasantāpa vajjito; [6.898]
Tất cả tật bệnh hết, lánh xa điều phiền não;
Sabbaveramatikkanto, nibbuto ca tuvaṃ bhava. [6.999]
Chinh phục các oán hận, mong con sống tĩnh an.

Tesaṃ saccena sīlena, khantimettābalena ca; [7.061]
Con dùng lời chân thật, nhờ sức nhẫn và từ bi;
Tepi amhenurakkhantu, arogena sukhena ca. [7.269]
Nguyện các Ngài gia hộ, con bình an, hạnh phúc.

Puratthimasmiṃ disābhāge, santi bhūtā mahiddhikā; [7.231]
Ở về nơi hướng Đông, có chư thần đại lực;
Tepi amhenurakkhantu, arogena sukhena ca. [7.202]
Nguyện các vị hộ trì, con bình an, hạnh phúc.
Dakkhiṇasmim disābhāge, santi devā mahiddhikā; [7.008]
Ở về nơi hướng Nam, có chư Thiên đại lực;
Tepi amhenurakkhantu, arogena sukhena ca. [7.620]
Nguyện các vị hộ trì, con bình an, hạnh phúc.
Pacchimasmiṃ disābhāge, santi nāgā mahiddhikā; [7.397]
Ở về nơi hướng Tây, có chư Rồng đại lực;
Tepi amhenurakkhantu, arogena sukhena ca. [7.147]
Nguyện các vị hộ trì, con bình an, hạnh phúc.
Uttarasmiṃ disābhāge, santi yakkhā mahiddhikā; [7.008]
Ở về nơi hướng Bắc, có Dạ Xoa đại lực;
Tepi amhenurakkhantu, arogena sukhena ca. [7.286]
Nguyện các vị hộ trì, con bình an, hạnh phúc.

Puratthimena Dhataraṭṭho, dakkhiṇena Virūḷhako; [6.785]
Đông: Thiên vương Trì Quốc; Nam: Thiên vương Tăng Trưởng ;
Pacchimena Virūpakkho, Kuvero uttaraṃ disaṃ. [6.618]
Tây: Thiên vương Quảng Mục; Bắc: Thiên vương Kuvera.
Cattāro te mahārājā, lokapālā yasassino; [7.147]
Bốn vị đại Thiên vương, có danh hộ thế gian;
Tepi amhenurakkhantu, arogena sukhena ca. [7.063]
Nguyện các vị hộ trì, con bình an hạnh phúc.

Ākāsaṭṭhā ca bhūmaṭṭha, devā nāgā mahiddhikā; [7.230]
Chư Thiên, Long đại lực, nơi hư không mặt đất;
Tepi amhenurakkhantu, arogena sukhena ca. [7.008]
Nguyện các vị hộ trì, con bình an hạnh phúc.
Iddhimanto ca ye devā, vasantā idha sāsane; [6.507]
Chư Thiên có thần thông, sống trong giáo pháp này;
Tepi amhenurakkhantu, arogena sukhena ca. [7.063]
Nguyện các vị hộ trì, con bình an hạnh phúc.

Sabbītiyo vivajjantu, soko rogo vinassatu; [6.674]
Nguyện tai họa lánh xa, tật bệnh, ưu sầu hết;
Mā te bhavantvantarāyā, sukhī dīghāyuko bhava. [7.453]
Nguyện con không chướng ngại, được an ổn, sống lâu.
Abhivādanasīlissa, niccaṃ vuḍḍhāpacāyino; [6.702]
Ai thường hay kính lễ, đến những bậc đáng kính;
Cattāro dhammā vaḍḍhanti, āyu vaṇṇo sukhaṃ balaṃ. [8.698]
Được tăng trưởng bốn pháp: vui, đẹp, khỏe và thọ.`
},

{
    id: 'Aṅgulimāla', title: '9. Aṅgulimālasutta', title_vn: '9. Kinh Aṅgulimāla', audio: '09-Angulimalasutta.mp3',
    text: `Parittaṃ yaṃ bhaṇantassa, nisinnaṭṭhānadhovanaṃ; [8.098]
Ngay cả nước để rửa chỗ ngồi của vị đã nói lên Hộ kinh này,
Udakampi vināseti, sabbameva parissayaṃ. [5.501]
Cũng có thể làm tiêu tan tất cả những tai ương;
Sotthinā gabbhavuṭṭhānaṃ, yañca sādheti taṅkhaṇe; [6.204]
Và đem lại sự khai nở dễ dàng tức thì cho sanh phụ.
Therassaṅgulimalassa, Lokanāthena bhāsitaṃ; [5.653]
Đây là bài kinh được Đấng Bảo Hộ dạy cho Tôn giả Aṅgulimāla,
Kappaṭṭhāyiṃ mahātejaṃ, parittaṃ taṃ bhaṇāma he. [7.299]
Này chư hiền, chúng ta hãy tụng lên bài hộ kinh này, có oai lực cho đến mãn kiếp.

“Yatohaṃ, bhagini, ariyāya jātiyā jāto, [5.929]
“Hỡi hiền tỷ! Từ khi tôi được sanh vào dòng Thánh đến nay,
Nābhijānāmi sañcicca pāṇaṃ jīvitā voropetā, [6.754]
Tôi chưa bao giờ cố ý giết hại mạng sống của chúng sanh.
Tena saccena sotthi te hotu, sotthi gabbhassa.” [6.648]
Mong với sự thật này, hiền tỷ được an lành, thai sản được an lành.”`
},

{
    id: 'Bojjhaṅga', title: '10. Bojjhaṅgasutta', title_vn: '10. Hộ Kinh Giác Chi', audio: '10-Bojjhangasutta.mp3',
    text: `Saṃsāre saṃsarantānaṃ, sabbadukkhavināsane; [9.683]
Đã hủy diệt mọi khổ, luân lưu trong luân hồi,
Satta dhamme ca bojjhaṅge, mārasenāpamaddane. [6.617]
Các pháp thất giác chi (của những vị hiền trí), đã đại thắng binh ma,
Bujjhitvā ye cime sattā, tibhavā muttakuttamā; [6.213]
Và khi đã liễu thông, bảy chi pháp giác ngộ, đã vượt thoát tam hữu;
Ajātimajarābyādhiṃ, amataṃ nibbhayaṃ gatā. [6.899]
Đạt vô úy bất tử, không sanh già bệnh chết.
Evamādi guṇūpetaṃ, anekaguṇasaṅgahaṃ; [6.334]
Đầy đủ vô số đức, những đức ấy ví như:
Osadhañca imaṃ mantaṃ, bojjhaṅgañca bhaṇāma he. [6.859]
Phương thảo dược, linh chú, này hỡi các hiền giả, cùng chúng tôi trì tụng, bài hộ kinh giác chi.

Bojjhaṅgo sati saṅkhāto, dhammānaṃ vicayo tathā; [6.576]
Các pháp thất giác chi, gồm có Niệm giác chi, và Trạch pháp giác chi;
Vīriyaṃ pīti passaddhi, bojjhaṅgā ca tathāpare. [6.738]
Thêm nữa là giác chi: Tinh tấn, Hỷ, Khinh an;
Samādhupekkhā bojjhaṅgā, sattete sabbadassinā; [7.101]
Định và Xả giác chi, bảy pháp giác chi ấy, đã được Bậc Toàn Giác;
Muninā sammadakkhātā, bhāvitā bahulīkatā. [6.536]
Bậc Đại Hiền khéo giảng, nếu được khéo thực hành, thực hành cho thuần thục;
Saṃvattanti abhiññāya, nibbānāya ca bodhiyā; [6.576]
Mang lại các thắng trí, Niết Bàn, đạo quả tuệ;
Etena saccavajjena, sotthi te hotu sabbadā. [6.576]
Mong lời chân thật này, người hằng được an lành.

Ekasmiṃ samaye Nātho, Moggallānañca Kassapaṃ; [6.193]
Một thuở, Bậc Đạo Sư, thấy hai vị trưởng lão, Ngài Moggallāna và ngài Kassapa;
Gilāne dukkhite disvā, bojjhaṅge satta desayi. [6.576]
Lâm bệnh nặng khổ thân, Phật bèn thuyết giác chi.
Te ca taṃ abhinanditvā, rogā mucciṃsu taṅkhaṇe; [6.819]
Thất giác chi được thuyết, các tôn giả hoan hỷ, bệnh tức khắc lành ngay;
Etena saccavajjena, sotthi te hotu sabbadā. [6.758]
Mong lời chân thật này, người hằng được an lành.

Ekadā Dhammarājāpi, gelaññenābhipīḷito; [6.375]
Một thuở Đấng Pháp Vương, thọ khổ thân trầm trọng;
Cundattherena taṃyeva, bhaṇāpetvāna sādaraṃ. [6.819]
Cũng vậy đức Cunda, cung kính tụng giác chi,
Sammoditvāna ābādhā, tamhā vuṭṭhāsi ṭhānaso, [6.980]
Khiến Phật-Đà hoan hỷ, bệnh liền khỏi tức thì;
Etena saccavajjena, sotthi te hotu sabbadā. [6.597]
Mong lời chân thật này, người hằng được an lành.

Pahīnā te ca ābādhā, tiṇṇannampi mahesinaṃ; [6.718]
Bệnh hoàn toàn dứt hẳn, với ba bậc Đại Sĩ;
Maggahatā kilesāva, pattānuppattidhammataṃ; [6.617]
Phiền não nào đoạn tuyệt, bởi đạo tuệ nào rồi, không còn sinh trở lại;
Etena saccavajjena, sotthi te hotu sabbadā. [7.806]
Mong lời chân thật này, người hằng được an lành.`
},

{
    id: 'Pubbaṇha', title: '11. Pubbaṇhasutta', title_vn: '11. Kinh Ban Mai', audio: '11-Pubbanhasutta.mp3',
    text: `Yaṃ dunnimittaṃ avamaṅgalañca, yo cāmanāpo sakuṇassa saddo; [11.880]
Những điềm triệu bất tường, tiếng điểu thú bi ai, những mộng mị chẳng lành, các nghịch duyên trở ngại,
Pāpaggaho dussupinaṃ akantaṃ, Buddhānubhāvena vināsamentu [9.306]
Nhờ uy linh Phật bảo, mong những nguy hại ấy, thảy đều mau tan biến.
Yaṃ dunnimittaṃ avamaṅgalañca, yo cāmanāpo sakuṇassa saddo; [8.147]
Những điềm triệu bất tường, tiếng điểu thú bi ai, những mộng mị chẳng lành, các nghịch duyên trở ngại,
Pāpaggaho dussupinaṃ akantaṃ, Dhammānubhāvena vināsamentu [9.052]
Nhờ uy linh Pháp bảo, mong những nguy hại ấy, thảy đều mau tan biến.
Yaṃ dunnimittaṃ avamaṅgalañca, yo cāmanāpo sakuṇassa saddo; [8.090]
Những điềm triệu bất tường, tiếng điểu thú bi ai, những mộng mị chẳng lành, các nghịch duyên trở ngại,
Pāpaggaho dussupinaṃ akantaṃ, Saṅghānubhāvena vināsamentu [9.363]
Nhờ uy linh Tăng bảo, mong những nguy hại ấy, thảy đều mau tan biến.
Dukkhappattā ca nidukkhā, bhayappattā ca nibbhayā; [6.308]
Đang khổ xin hết khổ, đang nguy dứt hiểm nguy,
Sokappattā ca nissokā, hontu sabbepi pāṇino. [6.647]
Đang sầu hết sầu bi, nguyện cầu cho muôn loài.
Ettāvatā ca amhehi sambhataṃ puññasampadaṃ; [6.619]
Do nói lời tán thán, công đức của chúng tôi.
Sabbe devānumodantu sabbasampattisiddhiyā. [6.327]
Nguyện tất cả Thiên thần, tựu thành mọi Thiên lạc.
Dānaṃ dadantu saddhāya, sīlaṃ rakkhantu sabbadā; [6.674]
Hãy cho với niềm tin (Nghiệp-quả và Tam Bảo), giới hạnh năng nghiêm trì,
Bhāvanābhiratā hontu, gacchantu devatāgatā. [6.541]
Hoan hỉ Pháp tăng thượng. Thiên giả nào đã đến, lắng nghe hộ kinh này, tùy hỷ công đức rồi, xin phản hồi Thiên sứ.
Sabbe Buddhā balappattā, paccekānañca yaṃ balaṃ; [6.922]
Chư Toàn Giác đại lực, Chư Độc Giác đại lực,
Arahantānañca tejena, rakkhaṃ bandhāmi sabbaso. [7.493]
Thanh Văn Giác đại lực, nguyện tổng trì uy đức, gia hộ con an lành.
Yaṃ kiñci vittaṃ idha vā huraṃ vā, saggesu vā yaṃ ratanaṃ paṇītaṃ; [9.300]
Phàm có tài sản gì, đời này hay đời sau, hay ở tại Thiên giới, có châu báu thù thắng,
Na no samaṃ atthi tathāgatena, [4.662]
Không gì sánh bằng được, với Như Lai Thiện Thệ,
Idampi Buddhe ratanaṃ paṇītaṃ; etena saccena suvatthi hotu. [8.991]
Như vậy nơi Đức Phật, là châu báu thù diệu, mong với sự thật này, mọi loài được hạnh phúc.
Yaṃ kiñci vittaṃ idha vā huraṃ vā, saggesu vā yaṃ ratanaṃ paṇītaṃ; [9.039]
Phàm có tài sản gì, đời này hay đời sau, hay ở tại Thiên giới, có châu báu thù thắng,
Na no samaṃ atthi tathāgatena, [4.329]
Không gì sánh bằng được, với Như Lai Thiện Thệ,
Idampi Dhamme ratanaṃ paṇītaṃ; etena saccena suvatthi hotu. [8.634]
Như vậy nơi đức Pháp, là châu báu thù diệu, mong với sự thật này, mọi loài được hạnh phúc.
Yaṃ kiñci vittaṃ idha vā huraṃ vā, saggesu vā yaṃ ratanaṃ paṇītaṃ; [9.015]
Phàm có tài sản gì, đời này hay đời sau, hay ở tại Thiên giới, có châu báu thù thắng,
Na no samaṃ atthi tathāgatena, [4.353]
Không gì sánh bằng được, với Như Lai Thiện Thệ,
Idampi Saṅghe ratanaṃ paṇītaṃ; etena saccena suvatthi hotu. [8.991]
Như vậy nơi đức Tăng, là châu báu thù diệu, mong với sự thật này, mọi loài được hạnh phúc.
Bhavatu sabbamaṅgalaṃ, rakkhantu sabbadevatā; [5.614]
Nguyện người trọn hạnh phúc, và chư Thiên che chở,
Sabba Buddhānubhāvena, sadā sukhī bhavantu te. [6.946]
Nhờ tất cả uy Phật, mong người hằng an lành.
Bhavatu sabbamaṅgalaṃ, rakkhantu sabbadevatā; [5.471]
Nguyện người trọn hạnh phúc, và chư Thiên che chở,
Sabba Dhammānubhāvena, sadā sukhī bhavantu te. [6.850]
Nhờ tất cả uy Pháp, mong người hằng an lành.
Bhavatu sabbamaṅgalaṃ, rakkhantu sabbadevatā; [5.471]
Nguyện người trọn hạnh phúc, và chư Thiên che chở,
Sabba Saṅghānubhāvena, sadā sukhī bhavantu te. [7.231]
Nhờ tất cả uy Tăng, mong người hằng an lành.
Mahākāruṇiko Nātho, hitāya sabbapāṇinaṃ; [6.327]
Đấng đại bi cứu khổ, vì lợi ích chúng sanh,
Pūretvā pāramī sabbā, patto sambodhimuttamaṃ; [5.851]
Huân tu ba la mật, chứng Vô Thượng Chánh Giác,
Etena saccavajjena, sotthi te hotu sabbadā. [7.017]
Nhờ với chân ngôn này, mong người được an lành.
Jayanto bodhiyā mūle, Sakyānaṃ nandivaḍḍhano, [6.565]
Vị đạt đến tối thắng, khiến vương tộc Thích Ca, tăng trưởng niềm hoan hỷ;
Evameva jayo hotu, jayassu jayamaṅgale. [6.184]
Bên cội cây Bồ Đề, trên bồ đoàn bất thối,
Aparājitapallaṅke, sīse puthuvipukkhale, [6.022]
Nơi Chư Phật lên ngôi, địa cầu Liên Hoa đỉnh.
Abhiseke sabbabuddhānaṃ, aggappatto pamodati. [6.660]
Mong người cũng chiến thắng, và khải hoàn như vậy. 
(Ngày nào hành thập thiện, ba hạnh nghiệp thanh tịnh)
Sunakkhattaṃ sumaṅgalaṃ suppabhātaṃ suhuṭṭhitaṃ; [6.755]
Đó là ngày cát tường, ngày có sao vận lành, có bình minh tốt đẹp, có thức giấc an lành,
Sukhaṇo sumuhutto ca, suyiṭṭhaṃ brahmacārisu. [6.589]
Mỗi giờ phút hưng thịnh, mỗi giây khắc hanh thông, cúng dường bậc phạm hạnh, là tế tự nhiệm mầu.
Padakkhiṇaṃ kāyakammaṃ vācākammaṃ padakkhiṇaṃ [6.303]
(Trong những ngày như vậy) Có hành động chân chánh, có lời nói an lành,
Padakkhiṇaṃ manokammaṃ paṇīdhi te padakkhiṇe. [6.280]
Trong sáng là ý nghĩ, ba nghiệp được tốt đẹp,
Padakkhiṇāni katvāna, labhantatthe padakkhiṇe. [6.042]
Thực hành điều tốt đẹp, thời đạt nhiều lợi ích,
Te atthaladdhā sukhitā viruḷhā Buddhasāsane; [7.112]
Nguyện cầu đến cho người, cùng thân bằng quyến thuộc, đạt lợi ích an vui,
Arogā sukhitā hotha, saha sabbehi ñātibhi. [8.455]
Vô bệnh được an lạc, tấn tu trong Pháp Phật.`
},

{
    id: 'Anekajati', title: 'Anekajāti Pāḷi ', title_vn: 'Kệ Khải Hoàn', audio: '12-Anekajati.mp3',
    text: `Namo tassa bhagavato arahato sammāsambuddhassa. [11.002]
Thành kính đảnh lễ Ngài, Thế Tôn, A-la-hán, Đấng Toàn Tri Diệu Giác.
Namo tassa bhagavato arahato sammāsambuddhassa. [11.596]
Thành kính đảnh lễ Ngài, Thế Tôn, A-la-hán, Đấng Toàn Tri Diệu Giác.
Namo tassa bhagavato arahato sammāsambuddhassa. [11.299]
Thành kính đảnh lễ Ngài, Thế Tôn, A-la-hán, Đấng Toàn Tri Diệu Giác.

Anekajātisaṃsāraṃ, sandhāvissaṃ anibbisaṃ; [7.582]
Luân hồi bao kiếp sống, tìm người làm nhà này, tìm mãi mà không gặp,
gahakāraṃ gavesanto, dukkhā jāti punappunaṃ. [7.211]
tái sanh hoài khổ thay.
gahakāraka diṭṭhosi, puna gehaṃ na kāhasi; [6.467]
Này hỡi người thợ kia, ngươi bị nhận diện rồi, nhà xây sao được nữa,
sabbā te phāsukā bhaggā, gahakūṭaṃ visaṅkhataṃ; [6.765]
rường cột ngươi bị gãy, rui mè đã tiêu vong,
visaṅkhāragataṃ cittaṃ, taṇhānaṃ khayamajjhagā. [7.359]
tâm ta chứng vô vi, mọi tham ái tận diệt.

Anekajātisaṃsāraṃ, sandhāvissaṃ anibbisaṃ; [6.839]
Luân hồi bao kiếp sống, tìm người làm nhà này, tìm mãi mà không gặp,
gahakāraṃ gavesanto, dukkhā jāti punappunaṃ. [6.542]
tái sanh hoài khổ thay.
gahakāraka diṭṭhosi, puna gehaṃ na kāhasi; [5.872]
Này hỡi người thợ kia, ngươi bị nhận diện rồi, nhà xây sao được nữa,
sabbā te phāsukā bhaggā, gahakūṭaṃ visaṅkhataṃ; [6.467]
rường cột ngươi bị gãy, rui mè đã tiêu vong,
visaṅkhāragataṃ cittaṃ, taṇhānaṃ khayamajjhagā. [6.839]
tâm ta chứng vô vi, mọi tham ái tận diệt.

Anekajātisaṃsāraṃ, sandhāvissaṃ anibbisaṃ; [6.170]
Luân hồi bao kiếp sống, tìm người làm nhà này, tìm mãi mà không gặp,
gahakāraṃ gavesanto, dukkhā jāti punappunaṃ. [6.557]
tái sanh hoài khổ thay.
gahakāraka diṭṭhosi, puna gehaṃ na kāhasi; [5.569]
Này hỡi người thợ kia, ngươi bị nhận diện rồi, nhà xây sao được nữa,
sabbā te phāsukā bhaggā, gahakūṭaṃ visaṅkhataṃ; [6.188]
rường cột ngươi bị gãy, rui mè đã tiêu vong,
visaṅkhāragataṃ cittaṃ, taṇhānaṃ khayamajjhagā. [6.895]
tâm ta chứng vô vi, mọi tham ái tận diệt.

Iti imasmiṃ sati idaṃ hoti, imassuppādā idaṃ uppajjati, [10.254]
Do cái này có, cái kia hiện hữu. Do cái này sanh, cái kia sanh. Tức là-
yadidaṃ – avijjāpaccayā saṅkhārā, saṅkhārapaccayā viññāṇaṃ, [7.205]
duyên vô minh, có các hành; duyên các hành, có thức;
viññāṇapaccayā nāmarūpaṃ, nāmarūpapaccayā saḷāyatanaṃ, [7.116]
duyên thức, có danh sắc; duyên danh sắc, có sáu xứ;
saḷāyatanapaccayā phasso, phassapaccayā vedanā, [6.055]
duyên sáu xứ, có xúc; duyên xúc, có thọ;
vedanāpaccayā taṇhā, taṇhāpaccayā upādānaṃ, [6.100]
duyên thọ, có ái; duyên ái, có thủ;
upādānapaccayā bhavo, bhavapaccayā jāti, [5.569]
duyên thủ, có hữu; duyên hữu, có sanh;
jātipaccayā jarāmaraṇaṃ sokaparidevadukkhadomanassupāyāsā sambhavanti. [8.707]
duyên sanh, có lão, tử, sầu, bi, khổ, ưu, não.
Evametassa kevalassa dukkhakkhandhassa samudayo hoti. [7.558]
Như vậy là sự tập khởi của toàn bộ khổ uẩn này.

Yadā have pātubhavanti dhammā; ātāpino jhāyato brāhmaṇassa; [7.823]
Thật sự khi các pháp, có mặt hiện khởi lên, cho vị Bà-la-môn, nhiệt tâm hành thiền định,
athassa kaṅkhā vapayanti sabbā; yato pajānāti sahetudhammaṃ. [8.707]
Khi ấy với vị ấy, các nghi hoặc tiêu trừ, vì biết rõ hoàn toàn, Pháp cùng với các nhân.

Iti imasmiṃ asati idaṃ na hoti, imassa nirodhā idaṃ nirujjhati, [9.989]
Do cái này không có, cái kia không hiện hữu. Do cái này diệt, cái kia diệt. Tức là-
yadidaṃ – avijjānirodhā saṅkhāranirodho, [5.437]
do vô minh diệt nên hành diệt;
saṅkhāranirodhā viññāṇanirodho, [4.420]
do hành diệt, nên thức diệt;
viññāṇanirodhā nāmarūpanirodho, [4.420]
do thức diệt nên danh sắc diệt;
nāmarūpanirodhā saḷāyatananirodho, [5.171]
do danh sắc diệt nên sáu xứ diệt;
saḷāyatananirodhā phassanirodho, [4.243]
do sáu xứ diệt nên xúc diệt,
phassanirodhā vedanānirodho, [3.845]
do xúc diệt nên thọ diệt,
vedanānirodhā taṇhānirodho, [4.022]
do thọ diệt nên ái diệt;
taṇhānirodhā upādānanirodho, [4.15]
do ái diệt nên thủ diệt;
upādānanirodhā bhavanirodho, [4.376]
do thủ diệt nên hữu diệt;
bhavanirodhā jātinirodho, [3.669]
do hữu diệt nên sanh diệt;
jātinirodhā jarāmaraṇaṃ sokaparidevadukkhadomanassupāyāsā nirujjhanti. [7.823]
do sanh diệt nên lão, tử, sầu, bi, khổ, ưu, não diệt.
Evametassa kevalassa dukkhakkhandhassa nirodho hoti. [6.763]
Như vậy là đoạn diệt của toàn bộ khổ uẩn này.

Yadā have pātubhavanti dhammā; ātāpino jhāyato brāhmaṇassa; [6.984]
Thật sự khi các pháp, có mặt hiện khởi lên, cho vị Bà-la-môn, nhiệt tâm hành thiền định,
athassa kaṅkhā vapayanti sabbā; yato khayaṃ paccayānaṃ avedi. [7.691]
Khi ấy với vị ấy, các nghi hoặc tiêu trừ, vì đã biết hoàn toàn, sự chấm dứt các duyên.

Iti imasmiṃ sati idaṃ hoti, imassuppādā idaṃ uppajjati, [9.459]
Do cái này có, cái kia hiện hữu. Do cái này sanh, cái kia sanh.
imasmiṃ asati idaṃ na hoti, imassa nirodhā idaṃ nirujjhati, [9.238]
Do cái này không có, cái kia không hiện hữu. Do cái này diệt, cái kia diệt. Tức là-
yadidaṃ – avijjāpaccayā saṅkhārā, saṅkhārapaccayā viññāṇaṃ, [6.807]
duyên vô minh, có các hành; duyên các hành, có thức;
viññāṇapaccayā nāmarūpaṃ, nāmarūpapaccayā saḷāyatanaṃ, [6.674]
duyên thức, có danh sắc; duyên danh sắc, có sáu xứ;
saḷāyatanapaccayā phasso, phassapaccayā vedanā, [5.613]
duyên sáu xứ, có xúc; duyên xúc, có thọ;
vedanāpaccayā taṇhā, taṇhāpaccayā upādānaṃ, [5.702]
duyên thọ, có ái; duyên ái, có thủ;
upādānapaccayā bhavo, bhavapaccayā jāti, [5.171]
duyên thủ, có hữu; duyên hữu, có sanh;
jātipaccayā jarāmaraṇaṃ sokaparidevadukkhadomanassupāyāsā sambhavanti. [7.868]
duyên sanh, có lão, tử, sầu, bi, khổ, ưu, não.
Evametassa kevalassa dukkhakkhandhassa samudayo hoti. [6.497]
Như vậy là sự tập khởi của toàn bộ khổ uẩn này.

Avijjāya tveva asesavirāganirodhā saṅkhāranirodho, [6.674]
Nhờ đoạn diệt viễn li mọi dục tham, do vô minh diệt nên hành diệt;
saṅkhāranirodhā viññāṇanirodho, [4.420]
do hành diệt, nên thức diệt;
viññāṇanirodhā nāmarūpanirodho, [4.464]
do thức diệt nên danh sắc diệt;
nāmarūpanirodhā saḷāyatananirodho, [4.774]
do danh sắc diệt nên sáu xứ diệt;
saḷāyatananirodhā phassanirodho, [4.022]
do sáu xứ diệt nên xúc diệt,
phassanirodhā vedanānirodho, [3.713]
do xúc diệt nên thọ diệt,
vedanānirodhā taṇhānirodho, [3.978]
do thọ diệt nên ái diệt;
taṇhānirodhā upādānanirodho, [4.022]
do ái diệt nên thủ diệt;
upādānanirodhā bhavanirodho, [3.757]
do thủ diệt nên hữu diệt;
bhavanirodhā jātinirodho, [3.934]
do hữu diệt nên sanh diệt;
jātinirodhā jarāmaraṇaṃ sokaparidevadukkhadomanassupāyāsā nirujjhanti. [8.531]
do sanh diệt nên lão, tử, sầu, bi, khổ, ưu, não diệt.
Evametassa kevalassa dukkhakkhandhassa nirodho hoti. [6.674]
Như vậy là đoạn diệt của toàn bộ khổ uẩn này.

Yadā have pātubhavanti dhammā; ātāpino jhāyato brāhmaṇassa; [7.072]
Thật sự khi các pháp, có mặt hiện khởi lên, cho vị Bà-la-môn, nhiệt tâm hành thiền định,
vidhūpayaṃ tiṭṭhati mārasenaṃ; sūriyova obhāsayamantalikkhaṃ. [7.956]
Quét sạch các ma quân, vị ấy đứng, an trú, như ánh sáng mặt trời, chói sáng khắp hư không.

Hetupaccayo, ārammaṇapaccayo, [4.685]
Nhân duyên, Cảnh duyên,
adhipatipaccayo, anantarapaccayo, [4.155]
Trưởng duyên, Vô Gián duyên,
samanantarapaccayo, sahajātapaccayo, [4.597]
Ðẳng Vô Gián duyên, Ðồng Sinh duyên,
aññamaññapaccayo, nissayapaccayo, [4.376]
Hỗ Tương duyên, Y Chỉ duyên,
upanissayapaccayo, purejātapaccayo, [4.553]
Cận Y duyên, Tiền Sinh Y duyên,
pacchājātapaccayo, āsevanapaccayo, [4.553]
Hậu Sinh duyên, Tập Hành duyên,
kammapaccayo, vipākapaccayo, [4.155]
Nghiệp duyên, Dị Thục duyên,
āhārapaccayo, indriyapaccayo, [4.199]
Vật Thực duyên, Căn Quyền duyên,
jhānapaccayo, maggapaccayo, [3.713]
Thiền Na duyên, Ðạo duyên,
sampayuttapaccayo, vippayuttapaccayo, [4.243]
Tương Ưng duyên, Bất Tương Ưng duyên,
atthipaccayo, natthipaccayo, [3.536]
Hiện Hữu duyên, Vô Hữu duyên,
vigatapaccayo, avigatapaccayoti. [5.486]
Ly duyên, Bất Ly duyên.
Jayanto bodhiyā mūle, Sakyānaṃ nandivaḍḍhano, [6.000]
Vị đạt đến tối thắng, khiến vương tộc Thích Ca, tăng trưởng niềm hoan hỷ;
Evameva jayo hotu, jayassu jayamaṅgale. [5.426]
Bên cội cây Bồ Đề, trên bồ đoàn bất thối,
Aparājitapallaṅke, sīse puthuvipukkhale, [5.018]
Nơi Chư Phật lên ngôi, địa cầu Liên Hoa đỉnh.
Abhiseke sabbabuddhānaṃ, aggappatto pamodati. [5.501]
Mong người cũng chiến thắng, và khải hoàn như vậy. 
(Ngày nào hành thập thiện, ba hạnh nghiệp thanh tịnh)
Sunakkhattaṃ sumaṅgalaṃ suppabhātaṃ suhuṭṭhitaṃ; [5.241]
Đó là ngày cát tường, ngày có sao vận lành, có bình minh tốt đẹp, có tỉnh giấc an vui,
sukhaṇo sumuhutto ca, suyiṭṭhaṃ brahmacārisu. [5.241]
Mỗi giờ phút hưng thịnh, mỗi giây khắc hanh thông, cúng dường bậc phạm hạnh, là tế tự nhiệm mầu.
Padakkhiṇaṃ kāyakammaṃ vācākammaṃ padakkhiṇaṃ [4.869]
(Trong những ngày như vậy) Có hành động chân chánh, có lời nói an lành,
Padakkhiṇaṃ manokammaṃ paṇīdhi te padakkhiṇe. [4.500]
Trong sáng là ý nghĩ, ba nghiệp được tốt đẹp,
Padakkhiṇāni katvāna, labhantatthe padakkhiṇe. [5.241]
Thực hành điều tốt đẹp, thời đạt nhiều lợi ích,
Te atthaladdhā sukhitā viruḷhā Buddhasāsane; [4.795]
Nguyện cầu đến cho người, cùng thân bằng quyến thuộc, đạt lợi ích an vui,
Arogā sukhitā hotha, saha sabbehi ñātibhi. [5.687]
Vô bệnh được an lạc, tấn tu trong Pháp Phật.
Bhavatu sabbamaṅgalaṃ, rakkhantu sabbadevatā; [4.980]
Nguyện người trọn hạnh phúc, và chư Thiên che chở,
Sabba Buddhānubhāvena, sadā sukhī bhavantu te. [5.612]
Nhờ tất cả uy Phật, mong người hằng an lành.
Bhavatu sabbamaṅgalaṃ, rakkhantu sabbadevatā; [4.795]
Nguyện người trọn hạnh phúc, và chư Thiên che chở,
Sabba Dhammānubhāvena, sadā sukhī bhavantu te. [5.538]
Nhờ tất cả uy Pháp, mong người hằng an lành.
Bhavatu sabbamaṅgalaṃ, rakkhantu sabbadevatā; [4.720]
Nguyện người trọn hạnh phúc, và chư Thiên che chở,
Sabba Saṅghānubhāvena, sadā sukhī bhavantu te. [6.802]
Nhờ tất cả uy Tăng, mong người hằng an lành.
Sādhu Sādhu Sādhu. [7.451]
Lành thay Lành thay Lành thay.`
},

{
    id: 'Paccavekkhaṇā', title: 'Paccavekkhaṇā', title_vn: 'Quán Tưởng (Tứ Vật Dụng)', audio: '13-Paccavekkhana.mp3',
    text: `Paṭisaṅkhā yoniso cīvaraṃ paṭisevāmi [6.660]
Chân chánh quán tưởng rằng: Ta thọ dụng y phục,
yāvadeva sītassa paṭighātāya, uṇhassa paṭighātāya, [9.399]
để ngăn ngừa nóng lạnh,
ḍaṃsa makasa vātātapa sarīsapa samphassānaṃ paṭighātāya, [8.022]
bảo vệ khỏi muỗi mòng, gió sương và mưa nắng, cùng rắn rết côn trùng,
yāvadeva hirikopīnappaṭicchādanatthaṃ. [6.560]
Và chỉ để che thân, tránh những điều hổ thẹn.

Paṭisaṅkhā yoniso piṇḍapātaṃ paṭisevāmi [5.939]
Chân chánh quán tưởng rằng: Ta thọ dụng vật thực
neva davāya, na madāya, na maṇḍanāya, na vibhūsanāya, [7.269]
không phải để vui đùa, không ham mê vô độ, không phải để trang sức, không tự làm đẹp mình,
yāvadeva imassa kāyassa ṭhitiyā [6.072]
mà chỉ để thân này được bảo trì mạnh khỏe,
yāpanāya, vihiṃsūparatiyā, brahmacariyānuggahāya, [6.737]
để tránh sự tổn thương, để trợ duyên phạm hạnh,
iti purāṇañca vedanaṃ paṭihaṅkhāmi [5.008]
cảm thọ cũ được trừ,
navañca vedanaṃ na uppādessāmi, [4.388]
thọ mới không sinh khởi,
yātrā ca me bhavissati anavajjatā ca phāsuvihāro ca. [7.491]
và sẽ không lầm lỗi, ta sống được an lành.

Paṭisaṅkhā yoniso senāsanaṃ paṭisevāmi [5.673]
Chân chánh quán tưởng rằng: ta thọ dụng liêu thất,
yāvadeva sītassa paṭighātāya, uṇhassa paṭighātāya, [8.466]
để ngăn ngừa nóng lạnh,
ḍaṃsa makasa vātātapa sarīsapa samphassānaṃ paṭighātāya, [6.914]
bảo vệ khỏi muỗi mòng, gió sương và mưa nắng, cùng rắn rết côn trùng,
yāvadeva utuparissaya vinodana paṭisallānārāmatthaṃ. [7.446]
để giải trừ nguy hiểm do phong thổ tứ thời, và chỉ với mục đích sống độc cư an tịnh.

Paṭisaṅkhā yoniso gilānappaccaya bhesajja parikkhāraṃ paṭisevāmi [7.047]
Chân chánh quán tưởng rằng: Ta thọ dụng y dược, dành cho người bệnh dùng,
yāvadeva uppannānaṃ veyyābādhikānaṃ vedanānaṃ paṭighātāya, [7.136]
để ngăn ngừa cảm thọ tàn hại đã phát sanh,
abyāpajjaparamatāya. [4.234]
được hoàn toàn bình phục.`
},

{
    id: 'Pabbajita', title: 'Pabbajita-abhiṇhasutta', title_vn: 'Kinh Pháp Sa Môn Thường Quán', audio: '14-Pabbajita-abhiṇhasutta.mp3',
    text: `Dasayime, bhikkhave, dhammā pabbajitena abhiṇhaṃ paccavekkhitabbā. [7.811]
Này các Tỳ-khưu, có mười pháp này, vị xuất gia phải luôn luôn quán sát.
Katame dasa? [3.007]
Thế nào là mười?
1. Vevaṇṇiyamhi ajjhupagato"ti [4.151]
1. "Ta nay đi đến tình trạng là người không có giai cấp" (mất hết giai cấp)
pabbajitena abhiṇhaṃ paccavekkhitabbaṃ; [4.738]
Người xuất gia phải luôn luôn quán sát;
2. Parapaṭibaddhā me jīvikā"ti [4.025]
2. "Ðời sống của ta tùy thuộc vào người khác"
pabbajitena abhiṇhaṃ paccavekkhitabbaṃ; [4.948]
Người xuất gia phải luôn luôn quán sát;
3. Añño me ākappo karaṇīyo"ti [4.235]
3. "Nay cử chỉ uy nghi của ta cần phải thay đổi!"
pabbajitena abhiṇhaṃ paccavekkhitabbaṃ; [4.738]
Vị xuất gia cần phải luôn luôn quán sát;
4. Kacci nu kho me attā sīlato na upavadatī"ti [5.660]
4. "Không biết tự ngã có chỉ trích ta về giới hạnh không?"
pabbajitena abhiṇhaṃ paccavekkhitabbaṃ; [4.864]
Vị xuất gia cần phải luôn luôn quán sát;
5. Kacci nu kho maṃ anuvicca viññū sabrahmacārī [5.241]
5. "Không biết các đồng Phạm hạnh có trí, sau khi tìm hiểu,
sīlato na upavadantī"ti [3.857]
có chỉ trích ta về giới hạnh không?"
pabbajitena abhiṇhaṃ paccavekkhitabbaṃ; [5.053]
Vị xuất gia cần phải luôn luôn quán sát;
6. Sabbehi me piyehi manāpehi [4.151]
6. "Mọi sự vật khả ái, khả ý của ta
nānābhāvo vinābhāvo"ti [3.732]
bị đổi khác, bị biến hoại"
pabbajitena abhiṇhaṃ paccavekkhitabbaṃ; [4.822]
Vị xuất gia cần phải luôn luôn quán sát;
7. Kammassakomhi kammadāyādo kammayoni kammabandhu [7.925]
7. "Ta là chủ của nghiệp, là thừa tự của nghiệp, là thai tạng của nghiệp, là bà con của nghiệp,
kammapaṭisaraṇo, yaṃ kammaṃ karissāmi kalyāṇaṃ vā pāpakaṃ vā [7.547]
là chỗ quy hướng của nghiệp; phàm nghiệp gì ta sẽ làm, thiện hay ác
tassa dāyādo bhavissāmī"ti [3.606]
ta sẽ thừa tự nghiệp ấy."
pabbajitena abhiṇhaṃ paccavekkhitabbaṃ; [5.367]
Vị xuất gia cần phải luôn luôn quán sát;
8. Kathaṃbhūtassa me rattindivā vītivattantī"ti [5.283]
8. "Ðêm ngày trôi qua bên ta và nay ta đã thành người như thế nào?"
pabbajitena abhiṇhaṃ paccavekkhitabbaṃ; [5.451]
Vị xuất gia cần phải luôn luôn quán sát;
9. Kacci nu kho ahaṃ suññāgāre abhiramāmī"ti [5.283]
9. "Ta có cố gắng hoan hỷ trong ngôi nhà trống không hay không?"
pabbajitena abhiṇhaṃ paccavekkhitabbaṃ; [4.780]
Vị xuất gia cần phải luôn luôn quán sát;
10. Atthi nu kho me uttari manussadhammo [4.696]
10. "Ta có chứng được pháp Thượng nhân,
alamariyañāṇadassanaviseso adhigato, [4.864]
tri kiến thù thắng xứng đáng bậc Thánh không,
yenāhaṃ pacchime kāle sabrahmacārīhi puṭṭho [5.493]
để đến những ngày cuối cùng, các đồng Phạm hạnh có hỏi,
na maṅku bhavissāmī"ti [3.103]
ta sẽ không có xấu hổ?"
pabbajitena abhiṇhaṃ paccavekkhitabbaṃ. [5.241]
Vị xuất gia cần phải luôn luôn quán sát.
Ime kho, bhikkhave, dasa dhammā [3.774]
Này các Tỳ-khưu, mười pháp này,
pabbajitena abhiṇhaṃ paccavekkhitabbā. [5.710]
vị xuất gia cần phải luôn luôn quán sát.`
},
{
    id: 'Pattidana', title: 'Mettābhāvanā', title_vn: 'Hồi hướng - Chia phước', audio: '15-Pattidana.mp3',
text: `Sabbe sattā, sabbe pāṇā, [3.709]
Nguyện cho tất cả chúng sinh, tất cả hữu tình,
sabbe bhūtā, sabbe puggalā, [3.398]
tất cả sanh loại, tất cả cá nhân,
sabbe attabhāvapariyāpannā, [3.832]
tất cả cá thể,
sabbā itthiyo, sabbe purisā, [3.934]
tất cả nữ giới, tất cả nam giới,
sabbe ariyā, sabbe anariyā, [3.461]
tất cả thánh nhân, tất cả phàm nhân,
sabbe devā, sabbe manussā, [3.177]
tất cả chư thiên, tất cả nhân loại,
sabbe vinipātikā [3.238]
tất cả chúng sanh nơi bốn đoạ xứ -
averā hontu, abyāpajjā hontu, [4.470]
không còn oan trái, không còn ác ý,
anīghā hontu, sukhī attānaṃ pariharantu. [4.959]
không còn muộn phiền, giữ mình được an vui.
Dukkhā muccantu, yathāladdhasampattito [4.371]
mong cho tất cả thoát khổ đau, những gì đã thành tựu
māvigacchantu kammassakā. [4.039]
xin đừng mất, chỉ có Nghiệp là tài sản mà thôi.

Puratthimāya disāya, pacchimāya disāya, [5.343]
Trong hướng Đông, trong hướng Tây,
uttarāya disāya, dakkhiṇāya disāya, [4.882]
trong hướng Bắc, trong hướng Nam,
puratthimāya anudisāya, pacchimāya anudisāya, [5.419]
trong hướng Đông-Nam, trong hướng Tây-Bắc,
uttarāya anudisāya, dakkhiṇāya anudisāya, [5.189]
trong hướng Đông-Bắc, trong hướng Tây-Nam,
heṭṭhimāya disāya, uparimāya disāya. [5.010]
Ở dưới, ở trên.

Sabbe sattā, sabbe pāṇā, [3.604]
Nguyện cho tất cả chúng sinh, tất cả hữu tình,
sabbe bhūtā, sabbe puggalā, [3.144]
tất cả sanh loại, tất cả cá nhân,
sabbe attabhāvapariyāpannā, [3.604]
tất cả cá thể,
sabbā itthiyo, sabbe purisā, [3.655]
tất cả nữ giới, tất cả nam giới,
sabbe ariyā, sabbe anariyā, [3.528]
tất cả thánh nhân, tất cả phàm nhân,
sabbe devā, sabbe manussā, [3.093]
tất cả chư thiên, tất cả nhân loại,
sabbe vinipātikā [3.144]
tất cả chúng sanh nơi bốn đoạ xứ -
averā hontu, abyāpajjā hontu, [4.473]
không còn oan trái, không còn ác ý,
anīghā hontu, sukhī attānaṃ pariharantu. [4.985]
không còn muộn phiền, giữ mình được an vui.
Dukkhā muccantu, yathāladdhasampattito [4.473]
mong cho tất cả thoát khổ đau, những gì đã thành tựu
māvigacchantu kammassakā. [3.834]
xin đừng mất, chỉ có Nghiệp là tài sản mà thôi.

Uddhaṃ yāva bhavaggā ca, adho yāva avīcito; [5.700]
Phía trên lên mãi đến vô cùng, phía dưới đến tận A-tỳ ngục,
Samantā cakkavāḷesu, ye sattā pathavīcarā; [5.470]
Trong toàn khắp thiên hà vũ trụ, những sanh linh nào sống trên đất
Abyāpajjā niverā ca, niddukkhā cā"nuppaddavā. [5.547]
Nguyện cho tất cả không còn ác ý, nguyện cho tất cả không còn oan trái, thoát khổ đau và thoát mọi hiểm nguy.

Uddhaṃ yāva bhavaggā ca, adho yāva avīcito; [5.394]
Phía trên lên mãi đến vô cùng, phía dưới đến tận A-tỳ ngục,
Samantā cakkavāḷesu, ye sattā udakecarā; [5.521]
Trong toàn khắp thiên hà vũ trụ, những sanh linh nào sống dưới nước –
Abyāpajjā niverā ca, niddukkhā cā"nuppaddavā. [5.649]
Nguyện cho tất cả không còn ác ý, nguyện cho tất cả không còn oan trái, thoát khổ đau và thoát mọi hiểm nguy.

Uddhaṃ yāva bhavaggā ca, adho yāva avīcito; [5.343]
Phía trên lên mãi đến vô cùng, phía dưới đến tận A-tỳ ngục,
Samantā cakkavāḷesu, ye sattā ākāsecarā; [5.189]
Trong toàn khắp thiên hà vũ trụ, những sanh linh nào sống trên không –
Abyāpajjā niverā ca, niddukkhā cā"nuppaddavā. [5.496]
Nguyện cho tất cả không còn ác ý, nguyện cho tất cả không còn oan trái, thoát khổ đau và thoát mọi hiểm nguy.

Yaṃ pattaṃ kusalaṃ tassa, ānubhāvena pāṇino; [5.343]
Nhờ oai lực thiện nghiệp đã thành tựu, nguyện cho tất cả mọi sanh linh
sabbe saddhammarājassa, ñatvā dhammaṃ sukhāvahaṃ. [5.573]
hay biết Diệu Pháp mang lại an vui của Đấng Pháp Vương,
Pāpuṇantu visuddhāya, sukhāya paṭipattiyā; [5.445]
với sự hành trì an lạc, thanh tịnh,
asokamanupāyāsaṃ, nibbānasukhamuttamaṃ. [5.598]
không còn sầu khổ và bất mãn, thành tựu được Niết bàn - lạc tối thượng.

Ciraṃ tiṭṭhatu saddhammo, dhamme hontu sagāravā; [5.700]
ngưỡng mong sanh linh thành kính Pháp, nguyện cầu Diệu Pháp mãi trường tồn.
sabbepi sattā kālena, sammā devo pavassatu. [5.445]
xin Chư thiên thường làm mưa thuận gió hoà,
Yathā rakkhiṃsu porāṇā, surājāno tathevimaṃ; [5.675]
giống các vị Hiền vương xa xưa, đã bảo vệ chúng dân đúng theo Pháp,
rājā rakkhatu dhammena, attanova pajaṃ pajaṃ. [5.521]
như bảo vệ dòng dõi của chính mình.

Imāya dhammānudhammapaṭipattiyā Buddhaṃ pūjemi. [5.726]
Với sự hành Pháp tuần tự này, con xin cúng dường Phật.
Imāya dhammānudhammapaṭipattiyā Dhammaṃ pūjemi. [6.058]
Với sự hành Pháp tuần tự này, con xin cúng dường Pháp.
Imāya dhammānudhammapaṭipattiyā Saṃghaṃ pūjemi. [6.186]
Với sự hành Pháp tuần tự này, con xin cúng dường Tăng.
Addhā imāya paṭipattiyā jātijarābyādhimaraṇamhā parimuccissāmi. [7.618]
Nhất định, nhờ sự hành Pháp tuần tự này, con sẽ thoát khỏi sanh-già-bệnh-chết
Idaṃ me puññaṃ āsavakkhayā"vahaṃ hotu. [4.959]
Phước lành này của con, nguyện đoạn trừ các lậu hoặc-trầm luân
Idaṃ me puññaṃ nibbānassa paccayo hotu. [4.831]
Phước lành này của con, nguyện là duyên thành tựu được Niết bàn.
Mama puññabhāgaṃ sabbasattānaṃ bhājemi; [5.112]
Phần phước của con, xin chia đều đến tất cả sanh linh,
Te sabbe me samaṃ puññabhāgaṃ labhantu. [6.186]
Mong tất cả hãy thọ nhận phần phước ấy được đều nhau.
Sādhu Sādhu Sādhu [11.800]
Sādhu! Sādhu! Lành thay!`
}, 
		
    ];

    /* --- QUIZ SYSTEM VARIABLES --- */
let quizQueue = [];
let currentQuizIndex = 0;
let currentTargetLineIndex = -1; // The line originally clicked
let isSectionExam = false; // Flag to distinguish line test vs final exam

/* --- QUIZ GENERATION LOGIC --- */

// Helper to clean word for matching (strips punctuation)
/* --- HELPER: CLEAN WORD (LOWERCASE + NO PUNCTUATION) --- */
function cleanPaliWord(text) {
    if (!text) return "";
    return text.toLowerCase()
        // Remove standard and special punctuation common in Pali/Vietnamese texts
        .replace(/[.,:;!?'"“”‘’()\[\]{}...–-]/g, '') 
        .replace(/\s+/g, '') // Remove any accidental whitespace inside
        .trim();
}

/* --- 1. GENERATE QUIZ DATA --- */
function generateQuizData(lineIdx, hideRatio = 0.4) {
    const lineDiv = allLines[lineIdx];
    const wordSpans = Array.from(lineDiv.querySelectorAll('.word'));
    const allWords = wordSpans.map(span => span.innerText);
    
    // 1. Identify Valid Indices (Skip words that become empty after cleaning)
    const allValidIndices = allWords.map((w, i) => cleanPaliWord(w) ? i : -1).filter(i => i !== -1);
    
    // 2. Filter eligible indices: ONLY words longer than 2 characters
    let eligibleIndices = allValidIndices.filter(i => cleanPaliWord(allWords[i]).length > 2);
    
    // Fallback: If a sentence ONLY has short words (<= 2 chars), pick the longest one 
    // to ensure the quiz doesn't break by having 0 questions.
    if (eligibleIndices.length === 0 && allValidIndices.length > 0) {
        let longestIndex = allValidIndices[0];
        let maxLength = 0;
        allValidIndices.forEach(i => {
            const len = cleanPaliWord(allWords[i]).length;
            if (len > maxLength) {
                maxLength = len;
                longestIndex = i;
            }
        });
        eligibleIndices = [longestIndex];
    }

    // 3. Determine number of blanks based on the TOTAL valid words to maintain the 40% ratio
    let countToHide = Math.ceil(allValidIndices.length * hideRatio);
    if (countToHide < 1) countToHide = 1;
    
    // Cap it so we don't try to hide more words than we have eligible (> 2 chars)
    if (countToHide > eligibleIndices.length) countToHide = eligibleIndices.length;

    // 4. Randomly select indices to hide FROM ELIGIBLE INDICES ONLY
    const shuffledIndices = eligibleIndices.sort(() => 0.5 - Math.random());
    const hiddenIndices = shuffledIndices.slice(0, countToHide).sort((a, b) => a - b);
    
    // 5. Get Correct Words (CLEANED)
    const correctHiddenWords = hiddenIndices.map(i => cleanPaliWord(allWords[i]));
    
    // 6. Generate Distractors (CLEANED)
    const totalOptionsNeeded = hiddenIndices.length * 3;
    const distractorCount = totalOptionsNeeded - correctHiddenWords.length;
    
    const distractors = getDistractors(lineIdx, distractorCount);
    
    // 7. Create Word Bank (All Cleaned)
    let wordBank = [...correctHiddenWords, ...distractors];
    
    // Shuffle Word Bank
    wordBank = wordBank.sort(() => 0.5 - Math.random());

    return {
        lineIndex: lineIdx,
        originalWords: allWords,    // Keeps original formatting for the sentence display
        hiddenIndices: hiddenIndices,
        wordBank: wordBank,         // Contains only lowercase, clean words
        userAnswers: new Array(hiddenIndices.length).fill(null)
    };
}

/* --- 2. GET DISTRACTORS (CLEANED) --- */
function getDistractors(targetIdx, count) {
    let pool = [];
    
    // Define neighbors (2 before, 1 after)
    let neighbors = [];
    if (targetIdx === 0) {
        neighbors = [1, 2, 3];
    } else if (targetIdx === allLines.length - 1) {
        neighbors = [targetIdx - 3, targetIdx - 2, targetIdx - 1];
    } else {
        neighbors = [targetIdx - 2, targetIdx - 1, targetIdx + 1];
    }

    // Filter valid lines
    neighbors = neighbors.filter(i => i >= 0 && i < allLines.length && i !== targetIdx);

    // Helper to add words to pool
    const addToPool = (lineIndex) => {
        const spans = allLines[lineIndex].querySelectorAll('.word');
        spans.forEach(s => {
            const clean = cleanPaliWord(s.innerText);
            if (clean) pool.push(clean); // Push CLEANED word
        });
    };

    // 1. Try getting words from neighbors
    neighbors.forEach(nIdx => addToPool(nIdx));

    // 2. Fallback: If pool is too small (short section), grab from anywhere
    if (pool.length < count) {
        allLines.forEach((div, i) => {
            if (i !== targetIdx && !neighbors.includes(i)) {
                 addToPool(i);
            }
        });
    }

    // 3. Return unique random words to fill the count
    // Shuffle full pool first
    pool = pool.sort(() => 0.5 - Math.random());
    
    // Take unique slice
    return [...new Set(pool)].slice(0, count);
}


    let globalInterval = 3000; 
    let recitationTimeout = null;
    let currentRecitationLine = 0;
    let allLines = [];
    let currentSectionIndex = 0;
	let selectedLoopIndices = new Set();
    
   let isLoopActive = false;

function toggleLoopSentence() {
    isLoopActive = !isLoopActive;
    const btn = document.getElementById('btn-loop');
    const loopOne = document.getElementById('loop-count');

    if (isLoopActive) {
        btn.classList.add('active-loop');
        loopOne.style.display = 'block'; // Show the "1"
    } else {
        btn.classList.remove('active-loop');
        loopOne.style.display = 'none'; // Hide the "1"
    }
}
    const displayArea = document.getElementById('display-area');
    const titleArea = document.getElementById('section-title');
    const sectionSelect = document.getElementById('section-select');
    const audioPlayer = document.getElementById('audioPlayer');
    const recitationToggleBtn = document.getElementById('recitation-toggle-btn');
    const settingsPanel = document.getElementById('settings-panel');
    const helpButton = document.getElementById('help-toggle');
    const helpContainer = document.getElementById('help-container');
    const symbolInfo = '<i class="fas fa-circle-info"></i>'; // Information symbol
    const symbolClose = '<i class="fas fa-xmark"></i>'; // Close symbol

    /* --- HELP MODAL LOGIC --- */
function openHelpModal() {
    document.getElementById('help-modal').style.display = 'flex';
}

function closeHelpModal(event) {
    // 1. Check if the background overlay was clicked
    const isOverlay = event.target.id === 'help-modal';
    
    // 2. Check if the click was on (or inside) the close buttons
    const isCloseBtn = event.target.closest('.btn-close-help') || 
                       event.target.closest('.btn-bottom-close');

    if (isOverlay || isCloseBtn) {
        document.getElementById('help-modal').style.display = 'none';
    }
}
    /* --- GLOBAL VARIABLE FOR WORD COUNTING --- */
let sectionWordOffsets = [];

function calculateGlobalWordOffsets() {
    let runningTotal = 0;
    sectionWordOffsets = [];

    sections.forEach(section => {
        sectionWordOffsets.push(runningTotal); // Store the starting word index for this section
        
        // Calculate words in this section
        const lines = section.text.split('\n');
        let sectionWordCount = 0;
        
        lines.forEach(line => {
            let cleanLine = line.trim();
            if (cleanLine === '') return;
            
            // Identify Pali lines by time marker
            const timeMatch = cleanLine.match(/\s*\[(\d+(\.\d+)?)\]\s*$/);
            
            if (timeMatch) {
                // Remove time marker to get pure text
                const textContent = cleanLine.replace(timeMatch[0], '').trim();
                // Count words
                const words = textContent.split(/\s+/);
                const validWords = words.filter(w => w.trim() !== '');
                sectionWordCount += validWords.length;
            }
        });
        
        runningTotal += sectionWordCount;
    });
}
    function init() {
        
        // --- 1. TẢI CÀI ĐẶT GIAO DIỆN VÀ TỐC ĐỘ BAN ĐẦU ---
        const savedTheme = localStorage.getItem('themePreference');
        const body = document.body;
        const btn = document.querySelector('.btn-darkmode');

        if (savedTheme === 'dark') {
            body.setAttribute('data-theme', 'dark');
            if (btn) btn.innerHTML = '<i class="fas fa-sun-bright"></i>';
        } else {
             body.removeAttribute('data-theme');
             if (btn) btn.innerHTML = '<i class="fas fa-moon"></i>';
        }
        const savedDictState = localStorage.getItem('dictionaryEnabled');
        // If it is 'true' OR null (first time user), turn it ON
        if (savedDictState === 'true' || savedDictState === null) {
            isLookupEnabled = true;
            const dictBtn = document.getElementById('btn-dictionary');
            if (dictBtn) dictBtn.style.backgroundColor = "#d35400";
            // Wait slightly or call directly
            enablePaliLookup(); 
        } else {
            // Explicitly 'false'
            isLookupEnabled = false;
            // No need to set color, default is none
        }
		const savedVietState = localStorage.getItem('vietnameseEnabled');
        const vietBtn = document.getElementById('btn-viet-toggle');
        // If it is 'true' OR null (first time user), turn it ON
        if (savedVietState === 'true' || savedVietState === null) {
            displayArea.classList.add('show-translation');
            if (vietBtn) vietBtn.classList.add('btn-viet-active');
        } else {
            displayArea.classList.remove('show-translation');
            if (vietBtn) vietBtn.classList.remove('btn-viet-active');
        }
        const savedInterval = localStorage.getItem('overrideInterval');
        const intervalInput = document.getElementById('recitation-interval');
        const speedControlArea = document.getElementById('speed-control-area');
        const btnShowSpeed = document.getElementById('btn-show-speed');

        if (savedInterval !== null) {
            const parsedInterval = parseFloat(savedInterval);
            globalInterval = parsedInterval * 1000; 
            intervalInput.value = parsedInterval.toFixed(1);
            document.getElementById('recitation-interval-label').innerText = parsedInterval.toFixed(1) + "s";
            
            speedControlArea.style.display = 'flex';
            btnShowSpeed.style.display = 'none';
        } else {
            globalInterval = 3000;
            intervalInput.value = 3;
            speedControlArea.style.display = 'none';
            btnShowSpeed.style.display = 'inline-block';
        }
calculateGlobalWordOffsets();
        // --- 2. SETUP PHẦN CÒN LẠI ---
        sections.forEach((sec, index) => {
            let option = document.createElement("option");
            option.value = index; option.text = sec.title;
            sectionSelect.appendChild(option);
        });
// BỔ SUNG: Xử lý đồng bộ khi người dùng tua (scrub) audio
        audioPlayer.addEventListener('seeked', () => {
            // Nếu đang trong chế độ Tuỳ chỉnh thời gian (Override Interval), không đồng bộ theo audio
            if (localStorage.getItem('overrideInterval')) return;

            // Chỉ chạy logic này khi đang trong chế độ Tụng Đọc
            if (displayArea.classList.contains('recitation-active')) {
                
                // 1. Tìm dòng văn bản mới tương ứng với thời gian audio hiện tại
                const newRecitationLine = findRecitationLine(audioPlayer.currentTime);
                
                // 2. Nếu dòng mới khác dòng cũ, tiến hành đồng bộ
                if (newRecitationLine !== currentRecitationLine) {
                    currentRecitationLine = newRecitationLine;
                    showRecitationLine(currentRecitationLine);
                }
                
                // 3. Xóa timer cũ và tạo timer mới (dựa trên thời gian còn lại của dòng mới)
                if (!audioPlayer.paused) {
                    // Khi audio đang chạy, runRecitationStep sẽ tự tính toán thời gian còn lại
                    // của dòng mới và đặt timer chính xác.
                    runRecitationStep();
                } else {
                    // Nếu audio đang dừng, chỉ cần xóa timer cũ và cập nhật visuals
                    if (recitationTimeout) {
                        clearTimeout(recitationTimeout);
                        recitationTimeout = null;
                    }
                    updateButtonVisuals('manual');
                }
            }
        });        

audioPlayer.addEventListener('play', () => {
    
    if (displayArea.classList.contains('recitation-active') && !recitationTimeout) {
        runRecitationStep();
    }
});
        
// CẬP NHẬT MỚI: Chỉ dừng timer nếu user bấm pause, không dừng nếu audio tự hết
        audioPlayer.addEventListener('pause', () => {
            // Chỉ chạy logic này khi đang trong chế độ Tụng Đọc
            if (displayArea.classList.contains('recitation-active')) {
                
                // Nếu audio dừng vì đã hết bài (ended), THOÁT NGAY.
                if (audioPlayer.ended) return; 

                // Nếu audio dừng do người dùng bấm pause (dù là nút Recitation hay nút Audio Player)
                if(recitationTimeout) {
                    clearTimeout(recitationTimeout); 
                    recitationTimeout = null;
                }
                updateButtonVisuals('manual');
            }
        });
		
audioPlayer.addEventListener('volumechange', () => {
    // Save the current volume (0.0 to 1.0) to localStorage
    localStorage.setItem('savedAudioVolume', audioPlayer.volume);
});
        // Sự kiện khi audio chạy hết bài: Reset về 0:00 và thoát chế độ Recitation
        audioPlayer.addEventListener('ended', () => {
    // If Loop is active and we are in Recitation Mode, 
    // DO NOT reset to 0. Let runRecitationStep handle the loop jump.
    if (isLoopActive && displayArea.classList.contains('recitation-active')) {
        return; 
    }
    
});
        // -------------------------
        let initialIndex = 0;
        const savedIndex = localStorage.getItem('lastSectionIndex');
        if (savedIndex !== null) {
            const parsedIndex = parseInt(savedIndex);
            if (parsedIndex >= 0 && parsedIndex < sections.length) {
                initialIndex = parsedIndex;
            }
        }
        
        loadSection(initialIndex);
    }

/* --- INFO MODAL LOGIC --- */
function showSectionInfo() {
    const currentSection = sections[currentSectionIndex];
    const infoContent = sectionInfoData[currentSection.id];
    
    if (infoContent) {
        // Default Title
        let displayTitle = "Về Kinh Hộ Trì Paritta";
        
        
        document.getElementById('simple-modal-title').innerText = displayTitle;
        document.getElementById('simple-modal-body').innerHTML = infoContent;
        document.getElementById('simple-info-modal').style.display = 'flex';
    }
}

function closeSimpleInfoModal() {
    document.getElementById('simple-info-modal').style.display = 'none';
}

function loadSection(index) {
    // 1. Check if Recitation Mode is CURRENTLY active
    const wasRecitationActive = document.body.classList.contains('recitation-active-mode');

    // 2. Stop audio if playing
    if (!audioPlayer.paused) audioPlayer.pause();
    
    // 3. Handle Index wrapping
    if (index < 0) index = sections.length - 1;
    if (index >= sections.length) index = 0;
    currentSectionIndex = index;
    
    // 4. Save preference
    localStorage.setItem('lastSectionIndex', index);
    selectedLoopIndices.clear();
    // 5. Update UI Basics
    sectionSelect.value = index;
    titleArea.innerText = sections[index].title;
	const infoIcon = document.getElementById('btn-section-info');
    if (sectionInfoData[sections[index].id]) {
        infoIcon.style.display = 'block';
    } else {
        infoIcon.style.display = 'none';
    }
	const vnTitleEl = document.getElementById('section-title-vn');
    if (vnTitleEl) {
        vnTitleEl.innerText = sections[index].title_vn || ""; // Fallback to empty if missing
    }
    audioPlayer.src = 'audio2/' + sections[index].audio; // Ensure path is correct ('audio/' or './audio/')
    
    // 6. Render the Text (This populates allLines)
    renderText(sections[index].text);

   isLoopActive = false;
        document.getElementById('btn-loop').classList.remove('active-loop');
		
		 updateOverallStats(); 
    if (wasRecitationActive) {
        // If mode was on, RESTART it for the new section immediately.
        // We do NOT call exitRecitation().
        
        // a. Re-initialize dashboard for new section
        startRecitationMode(); 
        
        // b. Reset audio position to 0
        audioPlayer.currentTime = 0;
        
        // c. Ensure visuals are set to "Manual" (Paused) start
        updateButtonVisuals('manual');
    } else {
        // If mode was off, ensure we clean up any remnants
        exitRecitation();
    }
}

    function selectSection() { loadSection(parseInt(sectionSelect.value)); }
    function changeSection(d) { loadSection(currentSectionIndex + d); }
// --- RANDOM FUNCTION ---
    function randomSection() {
        // Generate a random index between 0 and the last index of sections array
        const randomIndex = Math.floor(Math.random() * sections.length);
        
        // Load the section
        loadSection(randomIndex);
        
        // Optional: Scroll to top to ensure user sees the new title
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
/* --- NEW RENDER LOGIC --- */
/* --- NEW RENDER LOGIC --- */
function renderText(rawText) {
    displayArea.innerHTML = '';
    allLines = []; 
    
    // Get the starting Global Index for the current section
    let currentGlobalIndex = sectionWordOffsets[currentSectionIndex] || 0;

    const lines = rawText.split('\n');
    
    let cumulativeStartTimeMs = 0;
    const overrideIntervalMs = localStorage.getItem('overrideInterval') ? parseFloat(localStorage.getItem('overrideInterval')) * 1000 : null;

    lines.forEach(line => {
        let cleanLine = line.trim();
        if (cleanLine === '') return;

        const timeMatch = cleanLine.match(/\s*\[(\d+(\.\d+)?)\]\s*$/);

        if (timeMatch) {
            // === IS PALI LINE ===
            let customDuration = parseFloat(timeMatch[1]) * 1000;
            cleanLine = cleanLine.replace(timeMatch[0], ''); 

            const lineDiv = document.createElement('div');
            lineDiv.className = 'line-break';
            
            let currentLineDuration; 
            if (overrideIntervalMs !== null) {
                currentLineDuration = overrideIntervalMs;
                lineDiv.dataset.hasCustomTime = "false";
            } else {
                currentLineDuration = customDuration || 3000;
                lineDiv.dataset.hasCustomTime = "true";
            }

            lineDiv.dataset.startTime = cumulativeStartTimeMs / 1000;
            lineDiv.dataset.duration = currentLineDuration;

            cumulativeStartTimeMs += currentLineDuration;

            // Create clickable words for Pali
            cleanLine.split(/\s+/).forEach(wordStr => {
                if (wordStr.trim() === '') return;
                const span = document.createElement('span');
                span.className = 'word';
                span.innerText = wordStr;
                
                // --- NEW: Assign Global Index ---
                span.dataset.globalIndex = currentGlobalIndex++;
                // --------------------------------

                span.onclick = function() {
                    if (this.classList.contains('hidden')) {
                        this.classList.remove('hidden');
                        this.classList.add('revealed');
                    }
                };
                lineDiv.appendChild(span);
            });

            displayArea.appendChild(lineDiv);
            allLines.push(lineDiv); 

        } else {
            // === IS TRANSLATION LINE ===
            const transDiv = document.createElement('div');
            transDiv.className = 'translation-line';
            transDiv.innerText = cleanLine;
            displayArea.appendChild(transDiv);
        }
    });
}

// specific setup function or inside window.onload
function initAudioPlayer() {
    const savedVolume = localStorage.getItem('savedAudioVolume');
    
    if (savedVolume !== null) {
        // Convert the string back to a float and apply it
        audioPlayer.volume = parseFloat(savedVolume);
    } else {
        // Optional: Set a default if nothing is saved (e.g., 50%)
        audioPlayer.volume = 0.5; 
    }
}

// Call this when the app starts
initAudioPlayer();
function toggleVietnamese() {
    displayArea.classList.toggle('show-translation');
    const btn = document.getElementById('btn-viet-toggle');
    const isEnabled = displayArea.classList.contains('show-translation');
    
    if (isEnabled) {
        btn.classList.add('btn-viet-active');
    } else {
        btn.classList.remove('btn-viet-active');
    }

    // Save state to LocalStorage
    localStorage.setItem('vietnameseEnabled', isEnabled);
}

    function updateButtonVisuals(state) {
        recitationToggleBtn.classList.remove('active-auto', 'active-manual');
        if (state === 'auto') {
            recitationToggleBtn.classList.add('active-auto'); recitationToggleBtn.innerHTML = '<i class="fas fa-pause"></i>';
        } else if (state === 'manual') {
            recitationToggleBtn.classList.add('active-manual'); recitationToggleBtn.innerHTML = '<i class="fas fa-play"></i>';
        } else {
            recitationToggleBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        }
    }

/* =========================================
   MEMORIZATION DASHBOARD LOGIC
   ========================================= */

// Create a unique key for local storage: score_SectionID_LineIndex
function getScoreKey(lineIdx) {
    const sectionId = sections[currentSectionIndex].id;
    return `memo_score_${sectionId}_${lineIdx}`;
}

function getLineScore(lineIdx) {
    const val = localStorage.getItem(getScoreKey(lineIdx));
    return val ? parseInt(val) : 0;
}

function saveLineScore(lineIdx, score) {
    localStorage.setItem(getScoreKey(lineIdx), score);
    updateDashboardBox(lineIdx, score);
    updateOverallStats();
}

// Render the grid of boxes
// --- UPDATED DASHBOARD LOGIC WITH LONG PRESS ---

function renderDashboard() {
    const grid = document.getElementById('dashboard-grid');
    grid.innerHTML = ''; // Clear old

    allLines.forEach((line, idx) => {
        const score = getLineScore(idx);
        const box = document.createElement('div');
        
        // Add heatmap class
        box.className = `progress-box ${getHeatmapClass(score)}`;
        
        // Restore selection state if re-rendering
        if (selectedLoopIndices.has(idx)) {
            box.classList.add('multi-loop-selected');
        }

        box.innerText = idx + 1;
        box.id = `box-${idx}`;
        
        // ATTACH LONG PRESS EVENTS
        attachBoxEvents(box, idx);

        grid.appendChild(box);
    });

    updateOverallStats();
}

function attachBoxEvents(box, idx) {
    let longPressTimer;
    let isLongPress = false;

    const startPress = (e) => {
        isLongPress = false;
        longPressTimer = setTimeout(() => {
            isLongPress = true;
            toggleBoxSelection(idx);
            // Optional: Vibrate mobile device for feedback
            if (navigator.vibrate) navigator.vibrate(50);
        }, 400); // 500ms threshold for long press
    };

    const cancelPress = () => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
    };

    // Mouse Events
    box.addEventListener('mousedown', startPress);
    box.addEventListener('mouseup', cancelPress);
    box.addEventListener('mouseleave', cancelPress);

    // Touch Events
    box.addEventListener('touchstart', (e) => {
        // We do not preventDefault here to allow scrolling
        startPress(e);
    }, { passive: true });
    
    box.addEventListener('touchend', cancelPress);
    box.addEventListener('touchmove', cancelPress);

    // Click Event (Standard Jump)
    box.onclick = function(e) {
        // If it was a long press, ignore the click (don't jump)
        if (isLongPress) {
            e.stopPropagation();
            return;
        }
        jumpToLine(idx);
    };
}

function toggleBoxSelection(idx) {
    const box = document.getElementById(`box-${idx}`);
    if (selectedLoopIndices.has(idx)) {
        selectedLoopIndices.delete(idx);
        box.classList.remove('multi-loop-selected');
    } else {
        selectedLoopIndices.add(idx);
        box.classList.add('multi-loop-selected');
    }
}

// Determine color class based on score
function getHeatmapClass(score) {
    if (score === 0) return 'heatmap-0';
    if (score <= 25) return 'heatmap-1';
    if (score <= 50) return 'heatmap-2';
    if (score <= 75) return 'heatmap-3';
    return 'heatmap-4';
}

function updateDashboardBox(idx, score) {
    const box = document.getElementById(`box-${idx}`);
    if (box) {
        // Remove old heatmap classes
        box.classList.remove('heatmap-0', 'heatmap-1', 'heatmap-2', 'heatmap-3', 'heatmap-4');
        // Add new
        box.classList.add(getHeatmapClass(score));
    }
}

/* --- UPDATED XP SYSTEM --- */
function getSectionXP(sectionId) {
    const xp = localStorage.getItem(`section_xp_${sectionId}`);
    return xp ? parseInt(xp) : 0;
}

function addSectionXP(sectionId, amount) {
    // 1. Add to Section Total (Existing logic)
    const currentXP = getSectionXP(sectionId);
    localStorage.setItem(`section_xp_${sectionId}`, currentXP + amount);
    
    // 2. Add to Daily XP Log (Existing logic)
    const today = new Date().toISOString().split('T')[0];
    const dailyKey = `daily_xp_log_${today}`;
    const currentDaily = parseInt(localStorage.getItem(dailyKey) || 0);
    localStorage.setItem(dailyKey, currentDaily + amount);

    // 3. NEW: Add to Daily Section XP Log (For stacked charts)
    const dailySectionKey = `daily_section_xp_${sectionId}_${today}`;
    const currentDailySection = parseInt(localStorage.getItem(dailySectionKey) || 0);
    localStorage.setItem(dailySectionKey, currentDailySection + amount);
}

function getLevelInfo(xp) {
    // Calculate level: Starts at 1, adds 1 level for every 100 XP
    const level = Math.floor(xp / 100) + 1;
    let iconStr = "";

    if (level === 1) {
        iconStr = '<i class="fas fa-award-simple"></i>';
    } else if (level === 2) {
        iconStr = '<i class="fas fa-award"></i>';
    } else if (level === 3) {
        iconStr = '<i class="far fa-award-simple"></i>';
    } else if (level === 4) {
        iconStr = '<i class="far fa-award"></i>';
    } else {
        // Level 5 and up: Logic for Trophies
        // Level 5 = 1 trophy, Level 6 = 2 trophies, Level 7+ = 3 trophies
        let trophyCount = level - 4; 
        
        // Cap the trophies at 3
        if (trophyCount > 3) trophyCount = 3;

        // Generate the icons
        for (let i = 0; i < trophyCount; i++) {
            iconStr += '<i class="fas fa-trophy-star"></i>';
        }
    }

    return { level: level, icon: iconStr };
}
/* --- DAILY GOAL LOGIC --- */

function getDailyGoal() {
    return parseInt(localStorage.getItem('daily_xp_goal') || 100);
}

function getDailyXP() {
    const today = new Date().toISOString().split('T')[0];
    return parseInt(localStorage.getItem(`daily_xp_log_${today}`) || 0);
}

function editDailyGoal() {
    const currentGoal = getDailyGoal();
    const newGoal = prompt("Nhập mục tiêu hằng ngày của bạn:", currentGoal);
    
    if (newGoal !== null && !isNaN(newGoal) && newGoal > 0) {
        localStorage.setItem('daily_xp_goal', parseInt(newGoal));
        updateOverallStats(); // Refresh UI
    }
}
function updateOverallStats() {
    const dailyXP = getDailyXP();
    const dailyGoal = getDailyGoal();
    let dailyPct = Math.round((dailyXP / dailyGoal) * 100);
    
    // Cap visual width at 100% even if overachieved
    const visualWidth = dailyPct > 100 ? 100 : dailyPct;
    
    document.getElementById('bar-daily').style.width = visualWidth + '%';
    
    // Change color if goal reached
    if (dailyPct >= 100) {
        document.getElementById('bar-daily').style.backgroundColor = '#8e44ad'; // Purple for completion
    } else {
        document.getElementById('bar-daily').style.backgroundColor = '#e67e22'; // Orange default
    }

    // Update Text with Icon
    const penIcon = '<i class="fas fa-pen" onclick="editDailyGoal()" style="cursor: pointer; margin-left: 5px; font-size: 10px; opacity: 0.7;"></i>';
    document.getElementById('text-daily').innerHTML = `${dailyXP}/${dailyGoal} XP ${penIcon}`;
    let sessionTotalScore = 0;
    let sessionMaxScore = allLines.length * 100;
    allLines.forEach((_, idx) => {
        const s = getLineScore(idx);
        sessionTotalScore += s;
    });
    const sessionPct = sessionMaxScore === 0 ? 0 : Math.round((sessionTotalScore / sessionMaxScore) * 100);
    const globalStats = calculateGlobalStats();
    const globalPct = globalStats.maxScore === 0 ? 0 : Math.round((globalStats.currentScore / globalStats.maxScore) * 100);

    // Update Bars
    document.getElementById('bar-session').style.width = sessionPct + '%';
    document.getElementById('text-session').innerText = sessionPct + '%';
    document.getElementById('bar-total').style.width = globalPct + '%';
    document.getElementById('text-total').innerText = globalPct + '%';

    // --- LOGIC FOR SECTION EXAM BUTTON & BANNER ---
    
    // Check if user has ALREADY passed this section's final exam
    const sectionPassedKey = `section_passed_${sections[currentSectionIndex].id}`;
    const hasPassedSection = localStorage.getItem(sectionPassedKey) === 'true';
    const isRecitationActive = document.getElementById('display-area').classList.contains('recitation-active');
    const banner = document.getElementById('section-achievement-banner');
    let examContainer = document.getElementById('final-exam-container');

    // Helper to ensure exam button is visible and set text
    const showExamButton = (title, desc, btnText) => {
        if (!examContainer) {
            injectExamButton();
            examContainer = document.getElementById('final-exam-container');
        }
        examContainer.style.display = 'block';
        
        // Update text if elements exist
        const t = document.getElementById('exam-title');
        const d = document.getElementById('exam-desc');
        const b = document.getElementById('exam-btn');
        if (t) t.innerText = title;
        if (d) d.innerHTML = desc;
        if (b) b.innerText = btnText;
    };

    // LOGIC:
    // 1. If 100% Memorized (regardless of pass status), show the Exam Button
    if (hasPassedSection) {
        // SCENARIO: ALREADY PASSED
        
        // 1. Always show the banner
        banner.style.display = 'block';
        
        // 2. Only show "Retake" button if inside Recitation Mode
        if (isRecitationActive) {
            const currentSectionId = sections[currentSectionIndex].id;
            const currentXP = getSectionXP(currentSectionId);
            const levelInfo = getLevelInfo(currentXP);
            
            showExamButton(
                "Ôn Tập & Kiểm Tra", 
                `${levelInfo.icon} Mức độ thông thuộc: Cấp&nbsp;độ&nbsp;${levelInfo.level}&nbsp;(${currentXP}&nbsp;XP)`, 
                "Ôn tập lại"
            );
        } else {
            // If viewing normal text, hide the exam button to keep it clean
            if (examContainer) examContainer.style.display = 'none';
        }

    } else {
        // SCENARIO: NOT PASSED YET
        banner.style.display = 'none';

        if (sessionPct === 100) {
            // If 100% memorized but not passed: Always show button (Normal & Recitation)
            showExamButton(
                "Chúc mừng bạn đã thuộc 100% các câu!", 
                "Vượt qua bài kiểm tra tổng hợp để nhận Chứng Nhận.", 
                "Bắt đầu kiểm tra"
            );
        } else {
            // Not 100% yet
            if (examContainer) examContainer.style.display = 'none';
        }
    }

    // --- BANNER CONTENT UPDATE (If Visible) ---
    if (banner.style.display === 'block') {
        const bannerTitle = banner.querySelector('h3');
        const bannerSubtitle = banner.querySelector('div');

        if (globalPct === 100) {
            bannerTitle.innerHTML = '<i class="fas fa-wreath-laurel"></i> Hộ Trì Pháp Bảo <i class="fas fa-wreath-laurel"></i>';
            bannerSubtitle.innerHTML = 'Chứng Nhận Thành Tựu Học&nbsp;Thuộc&nbsp;Lòng Kinh&nbsp;Hộ&nbsp;Trì&nbsp;Paritta';
             showGrandAchievement();
        } else {
            bannerTitle.innerHTML = '<i class="fas fa-wreath-laurel"></i> Hộ Trì Học Pháp <i class="fas fa-wreath-laurel"></i>';
            bannerSubtitle.innerHTML = 'Chứng Nhận Thành Tựu Học&nbsp;Thuộc&nbsp;Lòng Bài&nbsp;Kinh&nbsp;Này';
        }
    }
}
/* --- HỆ THỐNG BIỂU ĐỒ (Dựa trên renderreport.js) --- */

let statsCharts = {
    section: null,
    weekly: null,
    monthly: null
};

// State variables for navigating dates
let statsCurrentWeekStart = null;
let statsCurrentMonth = null;

function openStatsModal() {
    document.getElementById('stats-modal').style.display = 'flex';
    // Khởi tạo/Reset lại UI khi mở (Render mặc định "Tuần này")
    setTimeout(() => renderStatsCharts(true), 100); 
}

function closeStatsModal() {
    document.getElementById('stats-modal').style.display = 'none';
}

function changeStatsWeek(offset) {
    if(!statsCurrentWeekStart) return;
    statsCurrentWeekStart.setDate(statsCurrentWeekStart.getDate() + (offset * 7));
    renderStatsCharts();
}

function changeStatsMonth(offset) {
    if(!statsCurrentMonth) return;
    statsCurrentMonth.setMonth(statsCurrentMonth.getMonth() + offset);
    renderStatsCharts();
}

/* --- HÀM RENDER LỊCH TU TẬP DỰA TRÊN XP --- */
function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    if (!grid) return;
    grid.innerHTML = '';
    
    // Sử dụng biến statsCurrentMonth có sẵn trong hệ thống Chart
    const y = statsCurrentMonth.getFullYear(); 
    const m = statsCurrentMonth.getMonth();
    
    document.getElementById('cal-month-year').innerText = new Date(y, m).toLocaleString('vi-VN', { month: 'long', year: 'numeric' });

    const headerDiv = document.createElement('div');
    headerDiv.className = 'calendar-header';
    ['T2','T3','T4','T5','T6','T7','CN'].forEach(d => {
        const h = document.createElement('div'); 
        h.className = 'cal-head-day'; 
        h.innerText = d;
        grid.appendChild(h);
    });

    const firstDayRaw = new Date(y, m, 1).getDay();
    // Chuyển Chủ nhật (0) thành vị trí cuối cùng trong tuần (6)
    const blankSlots = firstDayRaw === 0 ? 6 : firstDayRaw - 1;
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    
    for(let i=0; i<blankSlots; i++) { 
        grid.appendChild(document.createElement('div')); 
    }
    
    for(let i=1; i<=daysInMonth; i++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day'; 
        dayEl.innerText = i;
        
        // Đồng bộ chuẩn cách tạo chuỗi ngày với cách App đang lưu (tránh lệch múi giờ UTC)
        const d = new Date(y, m, i);
        const offset = d.getTimezoneOffset() * 60000;
        const dStr = new Date(d.getTime() - offset).toISOString().split('T')[0];
        
        // Lấy Tổng XP trong ngày từ localStorage
        const totalXP = parseInt(localStorage.getItem(`daily_xp_log_${dStr}`) || 0);

        if(totalXP > 0) {
            dayEl.classList.add('has-data');
            // Hiển thị tooltip lượng XP khi di chuột vào ô
            dayEl.title = `${totalXP} XP`;

            // Mức độ Level quy đổi theo điểm XP
            if (totalXP >= 250) dayEl.classList.add('level-8');      
            else if (totalXP >= 200) dayEl.classList.add('level-7'); 
            else if (totalXP >= 150) dayEl.classList.add('level-6'); 
            else if (totalXP >= 120) dayEl.classList.add('level-5'); 
            else if (totalXP >= 90) dayEl.classList.add('level-4');  
            else if (totalXP >= 60) dayEl.classList.add('level-3');  
            else if (totalXP >= 30) dayEl.classList.add('level-2');  
            else dayEl.classList.add('level-1');                             
            
            // ---> GẮN SỰ KIỆN ONCLICK ĐỂ MỞ BẢNG CHI TIẾT NGÀY <---
            const formattedDate = `${String(i).padStart(2, '0')}/${String(m + 1).padStart(2, '0')}/${y}`;
            dayEl.onclick = () => openDailyStatsModal(dStr, formattedDate);
        }

        grid.appendChild(dayEl);
    }
}
function renderStatsCharts(resetDates = false) {
    if (typeof Chart === 'undefined') {
        alert("Đang tải thư viện biểu đồ...");
        return;
    }

    const rangeSelect = document.getElementById('report-range-select');
    const rangeMode = rangeSelect ? rangeSelect.value : 'all';

    const now = new Date();
    const realCurrentDay = now.getDay() || 7; // 1-7 (Mon-Sun)
    const realThisWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - realCurrentDay + 1);
    const realThisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Handle Reset / Adjust Dates
    if (resetDates || !statsCurrentWeekStart || !statsCurrentMonth) {
        if (rangeMode === 'last_week') {
            statsCurrentWeekStart = new Date(realThisWeekStart);
            statsCurrentWeekStart.setDate(statsCurrentWeekStart.getDate() - 7);
            statsCurrentMonth = new Date(statsCurrentWeekStart.getFullYear(), statsCurrentWeekStart.getMonth(), 1);
        } else if (rangeMode === 'last_month') {
            statsCurrentMonth = new Date(realThisMonthStart);
            statsCurrentMonth.setMonth(statsCurrentMonth.getMonth() - 1);
            statsCurrentWeekStart = new Date(statsCurrentMonth.getFullYear(), statsCurrentMonth.getMonth(), 1);
            const day = statsCurrentWeekStart.getDay() || 7;
            statsCurrentWeekStart.setDate(statsCurrentWeekStart.getDate() - day + 1);
        } else {
            statsCurrentWeekStart = new Date(realThisWeekStart);
            statsCurrentMonth = new Date(realThisMonthStart);
        }
    }

    // --- CHART CONFIGURATION ---
    const commonOptions = {
        maintainAspectRatio: false,
        scales: {
            x: { stacked: true, grid: { color: '#374151' }, ticks: { color: '#9ca3af', font: { size: 11 } } },
            y: {
                stacked: true,
                grid: { color: '#374151' },
                title: { display: false },
                ticks: { color: '#9ca3af', font: { size: 11 } }
            }
        },
        plugins: {
            legend: { labels: { color: '#9ca3af', font: { size: 11 } } },
            tooltip: {
                backgroundColor: '#121821', titleColor: '#f3f4f6', bodyColor: '#f3f4f6', borderColor: '#374151', borderWidth: 1, padding: 10, z: 999,
                callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';
                        let value = context.raw || 0;
                        let total = 0;
                        
                        // Calculate the total of the stack for percentage
                        context.chart.data.datasets.forEach((dataset, i) => {
                            if (context.chart.isDatasetVisible(i)) {
                                total += dataset.data[context.dataIndex] || 0;
                            }
                        });

                        let percentage = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
                        return `${label}: ${value} XP (${percentage}%)`;
                    }
                }
            }
        }
    };

    // --- DATA PREPARATION ---
    const bgColors = [
    // 1-10: Nhóm màu rực rỡ (Vibrant)
    '#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', 
    '#e67e22', '#1abc9c', '#e84393', '#f39c12', '#d35400',
    
    // 11-20: Nhóm màu Pastel sáng (Light/Pastel)
    '#55efc4', '#81ecec', '#74b9ff', '#a29bfe', '#ffeaa7', 
    '#fab1a0', '#ff7675', '#fd79a8', '#badc58', '#dff9fb',
    
    // 21-30: Nhóm màu đậm/trầm (Deep/Dark)
    '#c0392b', '#2980b9', '#27ae60', '#f39c12', '#8e44ad', 
    '#d35400', '#16a085', '#2c3e50', '#192a56', '#441d49',
    
    // 31-40: Nhóm màu Neon và kẹo ngọt (Candy/Neon)
    '#00cec9', '#0984e3', '#6c5ce7', '#ff85a2', '#4cd137', 
    '#fbc531', '#487eb0', '#e056fd', '#ffbe76', '#ff7979',
    
    // 41-50: Nhóm màu trung tính và Earth tones (Earthy)
    '#95afc0', '#22a6b3', '#be2edd', '#4834d4', '#130f40', 
    '#6ab04c', '#f9ca24', '#eb4d4b', '#7ed6df', '#5758bb'
];

    // 1. Doughnut Chart Data (Overall)
    const sectionLabels = [];
    const sectionData = [];
	const doughnutColors = [];
    let totalXP = 0;
    
    // Array to hold dataset structures for Bar Charts
    let weeklyDatasets = [];
    let monthlyDatasets = [];
    const daysInMonth = new Date(statsCurrentMonth.getFullYear(), statsCurrentMonth.getMonth() + 1, 0).getDate();

    sections.forEach((sec, idx) => {
        let color = bgColors[idx % bgColors.length];
        
        // Setup Doughnut Data
        const xp = getSectionXP(sec.id);
        if (xp > 0) {
            sectionLabels.push(sec.title);
            sectionData.push(xp);
			doughnutColors.push(color);
            totalXP += xp;
        }

        // Setup base structures for Stacked Bar charts
        weeklyDatasets.push({
            label: sec.title,
            data: new Array(7).fill(0),
            backgroundColor: color,
            stack: '0',
            _sumWeek: 0
        });
        
        monthlyDatasets.push({
            label: sec.title,
            data: new Array(daysInMonth).fill(0),
            backgroundColor: color,
            stack: '0',
            _sumMonth: 0
        });
    });

    // 2. Weekly Chart Data Population
    const weekStartMs = statsCurrentWeekStart.getTime();
    const weekEndMs = weekStartMs + (7 * 24 * 60 * 60 * 1000);
    const weekEndDisp = new Date(weekEndMs - 1);
    document.getElementById('weekly-report-title').innerText = `Tuần (${statsCurrentWeekStart.toLocaleDateString('vi-VN', {month:'numeric', day:'numeric'})} - ${weekEndDisp.toLocaleDateString('vi-VN', {month:'numeric', day:'numeric'})})`;

    const weeklyLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    
    for (let i = 0; i < 7; i++) {
        const d = new Date(statsCurrentWeekStart);
        d.setDate(d.getDate() + i);
        const offset = d.getTimezoneOffset() * 60000;
        const dateStr = new Date(d.getTime() - offset).toISOString().split('T')[0];
        
        sections.forEach((sec, sIdx) => {
            const val = parseInt(localStorage.getItem(`daily_section_xp_${sec.id}_${dateStr}`) || 0);
            weeklyDatasets[sIdx].data[i] = val;
            weeklyDatasets[sIdx]._sumWeek += val;
        });
    }

    // 3. Monthly Chart Data Population
    const mYear = statsCurrentMonth.getFullYear();
    const mMonth = statsCurrentMonth.getMonth();
    document.getElementById('monthly-report-title').innerText = `Tháng ${new Date(mYear, mMonth).toLocaleDateString('vi-VN', { month: 'numeric', year: 'numeric' })}`;
    const monthlyLabels = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(mYear, mMonth, i);
        const offset = d.getTimezoneOffset() * 60000;
        const dateStr = new Date(d.getTime() - offset).toISOString().split('T')[0];
        
        sections.forEach((sec, sIdx) => {
            const val = parseInt(localStorage.getItem(`daily_section_xp_${sec.id}_${dateStr}`) || 0);
            monthlyDatasets[sIdx].data[i-1] = val;
            monthlyDatasets[sIdx]._sumMonth += val;
        });
    }

    // Filter out datasets that have 0 XP for the selected period to keep the legend clean
    weeklyDatasets = weeklyDatasets.filter(ds => ds._sumWeek > 0);
    monthlyDatasets = monthlyDatasets.filter(ds => ds._sumMonth > 0);

    // --- DRAW CHARTS ---

    // Doughnut Chart
    const ctxSection = document.getElementById('sectionXPChart').getContext('2d');
    if (statsCharts.section) statsCharts.section.destroy();

    const centerTextPlugin = {
        id: 'centerText',
        afterDatasetsDraw: function(chart) {
            const { ctx, chartArea: { top, bottom, left, right } } = chart;
            ctx.save();
            const centerX = (left + right) / 2;
            const centerY = (top + bottom) / 2;
            const chartHeight = bottom - top;
            const fontSizeMain = chartHeight / 10; 
            const fontSizeSub = chartHeight / 20;

            ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.font = `bold ${fontSizeMain}px sans-serif`;
            ctx.fillStyle = "#FFFFFF"; 
            ctx.fillText(totalXP.toLocaleString(), centerX, centerY - (fontSizeMain * 0.15));
            ctx.font = `normal ${fontSizeSub}px sans-serif`;
            ctx.fillStyle = "#9ca3af";
            ctx.fillText("XP", centerX, centerY + (fontSizeMain * 0.75));
            ctx.restore();
        }
    };

    statsCharts.section = new Chart(ctxSection, {
        type: 'doughnut',
        data: {
            labels: sectionLabels,
            datasets: [{ data: sectionData, backgroundColor: doughnutColors, borderWidth: 1, borderColor: '#1f2937' }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#9ca3af' }, position: 'bottom' },
                title: { display: sectionData.length === 0, text: 'Chưa có dữ liệu', position: 'bottom', color: '#6b7280' },
                tooltip: {
                    backgroundColor: '#121821', titleColor: '#f3f4f6', bodyColor: '#f3f4f6', borderColor: '#374151', borderWidth: 1, padding: 10,
                    callbacks: {
                        label: function(context) {
                            let value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
                            return ` ${value} XP (${percentage}%)`;
                        }
                    }
                }
            }
        },
        plugins: [centerTextPlugin]
    });

    // Weekly Stacked Bar Chart
    const ctxWeekly = document.getElementById('weeklyXPChart').getContext('2d');
    if (statsCharts.weekly) statsCharts.weekly.destroy();

    statsCharts.weekly = new Chart(ctxWeekly, {
        type: 'bar',
        data: {
            labels: weeklyLabels,
            datasets: weeklyDatasets.length > 0 ? weeklyDatasets : [{ label: 'Chưa có dữ liệu', data: new Array(7).fill(0), backgroundColor: '#374151' }]
        },
        options: {
            ...commonOptions,
            plugins: {
                ...commonOptions.plugins,
                tooltip: {
                    ...commonOptions.plugins.tooltip,
                    callbacks: {
                        ...commonOptions.plugins.tooltip.callbacks,
                        title: (context) => {
                            const index = context[0].dataIndex;
                            const date = new Date(statsCurrentWeekStart);
                            date.setDate(date.getDate() + index);
                            const dayName = index === 6 ? 'CN' : `T${index + 2}`;
                            return `${dayName} (${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')})`;
                        }
                    }
                }
            }
        }
    });

    // Monthly Stacked Bar Chart
    const ctxMonthly = document.getElementById('monthlyXPChart').getContext('2d');
    if (statsCharts.monthly) statsCharts.monthly.destroy();

    statsCharts.monthly = new Chart(ctxMonthly, {
        type: 'bar',
        data: {
            labels: monthlyLabels,
            datasets: monthlyDatasets.length > 0 ? monthlyDatasets : [{ label: 'Chưa có dữ liệu', data: new Array(daysInMonth).fill(0), backgroundColor: '#374151' }]
        },
        options: {
            ...commonOptions,
            plugins: {
                ...commonOptions.plugins,
                tooltip: {
                    ...commonOptions.plugins.tooltip,
                    callbacks: {
                        ...commonOptions.plugins.tooltip.callbacks,
                        title: (context) => `${String(context[0].label).padStart(2, '0')}/${String(mMonth + 1).padStart(2, '0')}`
                    }
                }
            }
        }
    });
	renderCalendar();
}
/* --- BIỂU ĐỒ CHI TIẾT THEO NGÀY (DOUGHNUT) --- */
let dailyChartInstance = null;

function openDailyStatsModal(dateStr, formattedDate) {
    document.getElementById('daily-modal-title').innerText = `Chi tiết ngày ${formattedDate}`;
    document.getElementById('daily-stats-modal').style.display = 'flex';
    renderDailyChart(dateStr);
}

function closeDailyStatsModal() {
    document.getElementById('daily-stats-modal').style.display = 'none';
}

function renderDailyChart(dateStr) {
    const ctx = document.getElementById('dailyXPChart').getContext('2d');
    if (dailyChartInstance) dailyChartInstance.destroy();

    const labels = [];
    const data = [];
    const colors = [];
    let totalDayXP = 0;

    // Sử dụng chung dải màu với bảng tổng quan
    const bgColors = [
        '#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', 
        '#e67e22', '#1abc9c', '#e84393', '#f39c12', '#d35400',
        '#55efc4', '#81ecec', '#74b9ff', '#a29bfe', '#ffeaa7', 
        '#fab1a0', '#ff7675', '#fd79a8', '#badc58', '#dff9fb',
        '#c0392b', '#2980b9', '#27ae60', '#f39c12', '#8e44ad', 
        '#d35400', '#16a085', '#2c3e50', '#192a56', '#441d49',
        '#00cec9', '#0984e3', '#6c5ce7', '#ff85a2', '#4cd137', 
        '#fbc531', '#487eb0', '#e056fd', '#ffbe76', '#ff7979',
        '#95afc0', '#22a6b3', '#be2edd', '#4834d4', '#130f40', 
        '#6ab04c', '#f9ca24', '#eb4d4b', '#7ed6df', '#5758bb'
    ];

    // Lọc data theo các bài kinh đã học trong ngày đó
    sections.forEach((sec, idx) => {
        const val = parseInt(localStorage.getItem(`daily_section_xp_${sec.id}_${dateStr}`) || 0);
        if (val > 0) {
            labels.push(sec.title);
            data.push(val);
            colors.push(bgColors[idx % bgColors.length]);
            totalDayXP += val;
        }
    });

    const centerTextPlugin = {
        id: 'centerTextDaily',
        afterDatasetsDraw: function(chart) {
            const { ctx, chartArea: { top, bottom, left, right } } = chart;
            ctx.save();
            const centerX = (left + right) / 2;
            const centerY = (top + bottom) / 2;
            const chartHeight = bottom - top;
            const fontSizeMain = chartHeight / 10; 
            const fontSizeSub = chartHeight / 20;

            ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.font = `bold ${fontSizeMain}px sans-serif`;
            // Tuỳ biến chữ trắng trên nền thẻ Card xám đen
            ctx.fillStyle = "#FFFFFF"; 
            ctx.fillText(totalDayXP.toLocaleString(), centerX, centerY - (fontSizeMain * 0.15));
            ctx.font = `normal ${fontSizeSub}px sans-serif`;
            ctx.fillStyle = "#9ca3af";
            ctx.fillText("XP", centerX, centerY + (fontSizeMain * 0.75));
            ctx.restore();
        }
    };

    dailyChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{ 
                data: data, 
                backgroundColor: colors, 
                borderWidth: 1, 
                borderColor: '#1f2937' 
            }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#9ca3af' }, position: 'bottom' },
                title: { display: data.length === 0, text: 'Chưa có dữ liệu', position: 'bottom', color: '#6b7280' },
                tooltip: {
                    backgroundColor: '#121821', titleColor: '#f3f4f6', bodyColor: '#f3f4f6', borderColor: '#374151', borderWidth: 1, padding: 10,
                    callbacks: {
                        label: function(context) {
                            let value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
                            return ` ${value} XP (${percentage}%)`;
                        }
                    }
                }
            }
        },
        plugins: [centerTextPlugin]
    });
}
function injectExamButton() {
    // Check if it already exists to avoid duplicates
    if (document.getElementById('final-exam-container')) return;

    const container = document.createElement('div');
    container.id = 'final-exam-container';
    // Added IDs to h4, p, and button for dynamic text updating
    container.innerHTML = `
        <h4 id="exam-title" style="margin-top:0; color:#b35900">Chúc mừng bạn đã thuộc 100% các câu!</h4>
        <p id="exam-desc">Vượt qua bài kiểm tra tổng hợp để nhận Chứng Nhận.</p>
        <button id="exam-btn" class="btn-primary" onclick="startSectionExam()">Bắt đầu</button>
    `;
    // Insert after dashboard grid
    const dashboard = document.getElementById('recitation-dashboard');
    dashboard.parentNode.insertBefore(container, dashboard.nextSibling);
}

function startSectionExam() {
    isSectionExam = true;
    quizQueue = [];
    const totalLines = allLines.length;
    
    // 1. Determine the Pool of Indices
    let pool = [];
    
    if (selectedLoopIndices.size > 0) {
        // PRIORITY: Create pool from User Selection (Long-pressed boxes)
        pool = Array.from(selectedLoopIndices);
    } else {
        // DEFAULT: Create pool from All Lines
        pool = Array.from({ length: totalLines }, (_, i) => i);
    }

    // 2. Shuffle the pool to ensure randomness
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    // 3. Determine Question Count based on Pool Size
    let questionCount = 10; // Default standard

    if (selectedLoopIndices.size > 0) {
        if (pool.length <= 2) {
            // Constraint: If 1 or 2 boxes selected -> Create 5 questions (cycling through them)
            questionCount = 5;
        
        } else {
            // Constraint: If >10 boxes selected -> Pick 10 unique ones
            questionCount = 10;
        }
    } else {
        // Standard Exam (No selection) -> 10 questions
        questionCount = (totalLines <= 2) ? 5 : 10;
    }

    // 4. Generate the Quiz Queue
    for (let i = 0; i < questionCount; i++) {
        // Use modulo to cycle through lines if pool is smaller than question count
        // (e.g., 2 selected boxes for 5 questions)
        let actualLineIdx = pool[i % pool.length];
        
        // Calculate difficulty
        // If we are repeating lines (repetition > 0), increase difficulty slightly
        let repetition = Math.floor(i / pool.length);
        let difficulty = 0.4 + (repetition * 0.1);
        if (difficulty > 0.6) difficulty = 0.6; // Cap at 60% hidden

        quizQueue.push(generateQuizData(actualLineIdx, difficulty));
    }

    // 5. Start Quiz
    currentQuizIndex = 0;
    
    // Update Title based on mode
    let titleText = "Kiểm Tra Tổng Hợp";
    if (selectedLoopIndices.size > 0) {
        titleText = `Ôn Tập (${selectedLoopIndices.size} câu chọn)`;
    }
    
    document.getElementById('quiz-title').innerText = `${titleText}`;
    openQuizModal();
}
function completeSectionExam() {
    // Save passed state
    const sectionPassedKey = `section_passed_${sections[currentSectionIndex].id}`;
    localStorage.setItem(sectionPassedKey, 'true');
    
    // Refresh stats to show banner
    updateOverallStats();
    
    // Scroll to banner
    document.getElementById('section-achievement-banner').scrollIntoView({behavior: 'smooth'});
    
    // Celebrate
    alert("Sādhu! Bạn đã hoàn thành xuất sắc bài kinh này.");
}

// Global variable to ensure we don't spam the user if they close the modal in the same session
let hasSeenGlobalModal = false;

function showGrandAchievement() {
    if (hasSeenGlobalModal) return;
    
    const modal = document.getElementById('grand-achievement-modal');
    modal.style.display = 'flex'; // Use flex to center
}

function closeAchievementModal() {
    const modal = document.getElementById('grand-achievement-modal');
    modal.style.display = 'none';
    hasSeenGlobalModal = true; // Mark as seen for this page load
}

// Helper: Iterates through ALL sections data to calculate total mastery
function calculateGlobalStats() {
    let totalScore = 0;
    let maxScore = 0;

    // Loop through every section defined in your data
    sections.forEach(section => {
        // We need to parse the text to find how many "audio lines" exist
        // Regex to match lines ending in time marker [x.x]
        const lines = section.text.split('\n');
        let lineIndex = 0;

        lines.forEach(rawLine => {
            const line = rawLine.trim();
            if (line === '') return;

            // Check if it's a valid recitation line (has time marker)
            if (/\s*\[(\d+(\.\d+)?)\]\s*$/.test(line)) {
                
                // Reconstruct the storage key: memo_score_SECTIONID_LINEINDEX
                // Note: lineIndex increments only for valid audio lines
                const key = `memo_score_${section.id}_${lineIndex}`;
                const savedScore = localStorage.getItem(key);
                
                totalScore += savedScore ? parseInt(savedScore) : 0;
                maxScore += 100; // Each line is worth 100%
                
                lineIndex++;
            }
        });
    });

    return { currentScore: totalScore, maxScore: maxScore };
}

// Function to handle clicking a box
function jumpToLine(idx) {
    const wasPlaying = !audioPlayer.paused;
    if (recitationTimeout) { clearTimeout(recitationTimeout); recitationTimeout = null; }
    
    currentRecitationLine = idx;
    showRecitationLine(idx);
    
    // Sync Audio
    const targetEl = allLines[idx];
    const startTime = parseFloat(targetEl.dataset.startTime || 0);
    audioPlayer.currentTime = startTime;

    if (wasPlaying) {
        // If it was playing, keep playing from the new time
        audioPlayer.play();
        // You may need to update visuals to 'playing' state here if 'manual' sets it to pause
        // updateButtonVisuals('playing'); 
    } else {
        // If it was paused, keep it paused and update visuals
        updateButtonVisuals('manual'); 
        audioPlayer.pause();
    }
} 
function toggleRecitationAction() {
    const isActive = displayArea.classList.contains('recitation-active');
    const isRunning = !!recitationTimeout;

    if (!isActive) {
        // Action: START RECITATION MODE (Manual Start)
        
        startRecitationMode();
        
        // --- CHANGE HERE: REMOVED audioPlayer.play() ---
        // By removing audioPlayer.play(), the mode starts but the audio remains paused.
        // startRecitationMode() already sets the initial line and the 'manual' visual state.
        
        return;
    }

    // We are already in Recitation Mode
    if (isRunning || !audioPlayer.paused) {
        // Action: PAUSE
        // This handles pausing when in auto-play or manual-play state.
        if (!audioPlayer.paused) audioPlayer.pause();
    } else {
        // Action: PLAY / RESUME
        if (audioPlayer.ended) {
            // If audio ended, reset, and start from the beginning
            audioPlayer.currentTime = 0;
            currentRecitationLine = 0;
            showRecitationLine(0);
        }
        // Simply call play. The 'play' event listener will trigger the self-correcting runRecitationStep.
        audioPlayer.play();
    }
}
function findRecitationLine(currentTime) {
        // Iterate backwards for slightly more efficient search, 
        // especially if seeking near the end.
        for (let i = allLines.length - 1; i >= 0; i--) {
            const line = allLines[i];
            const startTime = parseFloat(line.dataset.startTime || 0);
            const duration = parseFloat(line.dataset.duration || 0) / 1000;
            const endTime = startTime + duration;

            // If the current audio time is within this line's window
            if (currentTime >= startTime && currentTime < endTime) {
                return i;
            }
        }
        // If the current time is before the first line, return the first line (0)
        return 0;
    }
    function startRecitationMode() {
    resetText();
    displayArea.classList.add('recitation-active');
    document.body.classList.add('recitation-active-mode');
    if (typeof Website2APK !== 'undefined') {
        try {
            Website2APK.keepScreenOn(true);
        } catch (e) {
            console.log("Website2APK error: " + e);
        }
    }
    // --- NEW: GENERATE DASHBOARD ---
    renderDashboard(); 
    // -------------------------------

    currentRecitationLine = 0;
    showRecitationLine(0);
    updateButtonVisuals('manual');
}

    function exitRecitation() {
        if(recitationTimeout) clearTimeout(recitationTimeout); recitationTimeout = null;
        if(!audioPlayer.paused) audioPlayer.pause();
if (typeof Website2APK !== 'undefined') {
        try {
            Website2APK.keepScreenOn(false);
        } catch (e) {
            console.log("Website2APK error: " + e);
        }
    }
        displayArea.classList.remove('recitation-active');
        document.body.classList.remove('recitation-active-mode');
        document.querySelector('.line-recitation-show')?.classList.remove('line-recitation-show');
        
        // --- FIX: Remove all slider containers from the text ---
        document.querySelectorAll('.memorize-slider-container').forEach(el => el.remove());
        // -------------------------------------------------------
        updateOverallStats();
        updateButtonVisuals('inactive');
    }

    function runRecitationStep() {
    if (recitationTimeout) clearTimeout(recitationTimeout);
    
    // Safety check
    if (currentRecitationLine >= allLines.length) { exitRecitation(); return; }

    showRecitationLine(currentRecitationLine);
    updateButtonVisuals('auto'); 

    const el = allLines[currentRecitationLine];
    const dur = parseFloat(el.dataset.duration);
    const startTimeSeconds = parseFloat(el.dataset.startTime);

    let timeToNextStep = dur; 
    const isCustomSpeed = localStorage.getItem('overrideInterval') !== null;
    
    // --- 1. Calculate time remaining for current line ---
    if (!isCustomSpeed && !audioPlayer.paused) {
        const lineDurationSeconds = dur / 1000;
        const elapsedTimeSeconds = audioPlayer.currentTime - startTimeSeconds;
        const remainingDurationMs = (lineDurationSeconds - elapsedTimeSeconds) * 1000;
        
        if (remainingDurationMs > 50) {
            timeToNextStep = remainingDurationMs;
        } else {
            // If we are already past the time, force a tiny delay to trigger the transition immediately
            timeToNextStep = 10;
        }
    }

    // --- 2. Determine the Next Index (The Sequence Logic) ---
    recitationTimeout = setTimeout(() => {
        let nextIdx;

        if (isLoopActive) {
            // --- A. Loop Mode (Single or Selected Boxes) ---
            if (selectedLoopIndices.size > 0) {
                 // Multi-loop logic...
                 const sortedIndices = Array.from(selectedLoopIndices).sort((a, b) => a - b);
                 const nextInSequence = sortedIndices.find(i => i > currentRecitationLine);
                 nextIdx = nextInSequence !== undefined ? nextInSequence : sortedIndices[0];
            } else {
                 // Single Loop (Current Sentence)
                 nextIdx = currentRecitationLine; 
            }
        } else {
            // --- B. Normal Mode (Default: Loop Entire Section) ---
            nextIdx = currentRecitationLine + 1;
            
            // IF we reach the end, wrap back to 0 (Loop All)
            if (nextIdx >= allLines.length) {
                nextIdx = 0;
            }
        }

        // --- 3. Execute Transition ---
        if (nextIdx < allLines.length) {
            const prevLine = currentRecitationLine;
            currentRecitationLine = nextIdx;
            
            // Sync Audio logic
            // We need to seek audio if:
            // 1. Loop Mode is Active (Single or Multi jumping back)
            // 2. We wrapped around from End -> Start in Normal Mode (Loop All)
            
            const wrappedAround = (!isLoopActive && nextIdx === 0 && prevLine === allLines.length - 1);
            
            if ((isLoopActive || wrappedAround) && !isCustomSpeed) {
                const targetLine = allLines[currentRecitationLine];
                const newStart = parseFloat(targetLine.dataset.startTime);
                
                audioPlayer.currentTime = newStart;
                
                // Ensure audio resumes if it paused at the end of the track
                if (audioPlayer.paused) audioPlayer.play(); 
            }

            runRecitationStep(); 
        } else {
            // This path is now rarely taken unless the text is empty
            exitRecitation(); 
        }

    }, timeToNextStep);
}

    function showRecitationLine(idx) {
    // 1. Remove highlight from previous line
    document.querySelector('.line-recitation-show')?.classList.remove('line-recitation-show');
    
    // 2. Remove highlight from previous dashboard box
    document.querySelector('.progress-box.active-box')?.classList.remove('active-box');

    // 3. Highlight new line & new box
    if (allLines[idx]) {
        const lineDiv = allLines[idx];
        lineDiv.classList.add('line-recitation-show');
        lineDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Highlight box in dashboard
        const box = document.getElementById(`box-${idx}`);
        if(box) box.classList.add('active-box');

        // --- NEW: INJECT SLIDER ---
        injectSlider(lineDiv, idx);
    }
}


function injectSlider(lineElement, idx) {
    let container = lineElement.querySelector('.memorize-slider-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'memorize-slider-container';
        
        // 1. Checkbox Section
        const label = document.createElement('label');
        label.className = 'memorize-checkbox-label';
        
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.className = 'memorize-checkbox';
        input.id = `checkbox-${idx}`; 

        input.addEventListener('click', function(e) {
            const isChecked = this.checked;
            if (isChecked) {
                e.preventDefault(); 
                // Mode: 'check' -> Questions 1 & 2
                startLineTest(idx, 'check');
            } else {
                saveLineScore(idx, 0);
            }
        });

        const textSpan = document.createElement('span');
        textSpan.innerText = "Đã thuộc"; 

        label.appendChild(input);
        label.appendChild(textSpan);
        container.appendChild(label);

        // 2. NEW: Practice Button Section
        const practiceBtn = document.createElement('button');
        practiceBtn.className = 'btn-practice';
        practiceBtn.innerHTML = '<i class="fas fa-bullseye-arrow"></i> Luyện Tập';
        practiceBtn.onclick = function() {
            // Mode: 'practice' -> Questions 1 & 3
            startLineTest(idx, 'practice');
        };
        
        container.appendChild(practiceBtn);

        lineElement.appendChild(container);
    }

    // Sync state
    const currentScore = getLineScore(idx);
    const input = container.querySelector('input');
    input.checked = (currentScore >= 100);
}

/* --- HELPER: GET TRANSLATION FOR PALI LINE --- */
function getTranslationForLine(sectionIdx, targetLineIdx) {
    const lines = sections[sectionIdx].text.split('\n');
    let currentPaliIndex = -1;
    let paliText = "";
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (line === '') continue;
        
        const timeMatch = line.match(/\s*\[(\d+(\.\d+)?)\]\s*$/);
        if (timeMatch) {
            currentPaliIndex++;
            if (currentPaliIndex === targetLineIdx) {
                paliText = line.replace(timeMatch[0], '').trim();
                // Tìm dòng dịch (dòng tiếp theo không chứa time marker)
                for (let j = i + 1; j < lines.length; j++) {
                    let nextLine = lines[j].trim();
                    if (nextLine === '') continue;
                    if (!nextLine.match(/\s*\[(\d+(\.\d+)?)\]\s*$/)) {
                        return { pali: paliText, trans: nextLine };
                    } else {
                        break; // Gặp câu Pali tiếp theo -> Không có bản dịch
                    }
                }
                return { pali: paliText, trans: "(Không có bản dịch)" };
            }
        }
    }
    return { pali: "", trans: "" };
}

function getRandomTranslations(count, excludeTrans) {
    let finalDistractors = [];

    // 1. Tạo mảng chứa thứ tự ưu tiên các Section
    // Bắt đầu bằng section hiện tại
    let prioritizedIndices = [currentSectionIndex]; 
    let maxOffset = Math.max(currentSectionIndex, sections.length - 1 - currentSectionIndex);

    // Mở rộng dần ra: Liền trước (-1) rồi Liền sau (+1), tiếp tục (-2) rồi (+2)...
    for (let offset = 1; offset <= maxOffset; offset++) {
        let prev = currentSectionIndex - offset;
        let next = currentSectionIndex + offset;

        if (prev >= 0) prioritizedIndices.push(prev);
        if (next < sections.length) prioritizedIndices.push(next);
    }

    // 2. Duyệt qua từng section theo thứ tự ưu tiên
    for (let secIdx of prioritizedIndices) {
        let currentSecTrans = [];
        const lines = sections[secIdx].text.split('\n');
        
        // Lấy tất cả các câu dịch trong section này
        lines.forEach(line => {
            let l = line.trim();
            // Bỏ qua dòng trống và dòng Pali (có time marker)
            if (l !== '' && !l.match(/\s*\[(\d+(\.\d+)?)\]\s*$/)) {
                currentSecTrans.push(l);
            }
        });

        // 3. Lọc trùng lặp, loại câu ngắn (<=5), loại đáp án đúng, 
        // VÀ loại cả những đáp án đã được đưa vào mảng finalDistractors trước đó
        let uniqueValidTrans = [...new Set(currentSecTrans)].filter(t => 
            t !== excludeTrans && 
            t.length > 5 && 
            !finalDistractors.includes(t)
        );

        // 4. Trộn ngẫu nhiên danh sách hợp lệ của section này
        uniqueValidTrans.sort(() => 0.5 - Math.random());

        // 5. Bổ sung từ từ vào danh sách kết quả cuối cùng cho đến khi đủ số lượng
        for (let trans of uniqueValidTrans) {
            if (finalDistractors.length < count) {
                finalDistractors.push(trans);
            }
            // Nếu đã lấy đủ thì ngắt vòng lặp và trả về kết quả luôn
            if (finalDistractors.length === count) {
                return finalDistractors; 
            }
        }
    }

    // Trả về số lượng thu thập được (phòng trường hợp toàn bộ dữ liệu vẫn không đủ 'count')
    return finalDistractors;
}

/* --- GENERATE TRANSLATION QUIZ DATA --- */
function generateTranslationQuizData(lineIdx) {
    const { pali, trans } = getTranslationForLine(currentSectionIndex, lineIdx);
    // Lấy 3 đáp án nhiễu
    const distractors = getRandomTranslations(3, trans);
    
    let options = [trans, ...distractors];
    // Trộn ngẫu nhiên vị trí của 4 đáp án
    options.sort(() => 0.5 - Math.random()); 
    
    return {
        type: 'translation',
        paliText: pali,
        correctTranslation: trans,
        options: options,
        userAnswer: null
    };
}

let isPracticeMode = false; // Flag to track if we are in practice mode

function startLineTest(idx, mode = 'check') {
    isSectionExam = false;
    currentTargetLineIndex = idx;
    quizQueue = [];
    
    // Set global flag
    isPracticeMode = (mode === 'practice');

    // === NEW LOGIC: MULTI-SELECT PRACTICE MODE ===
    // If user clicked "Luyện Tập" AND has specific boxes selected via Long Press
    if (isPracticeMode && selectedLoopIndices.size > 0) {
        
        // 1. Get selected lines and sort them (e.g., 3, 5, 7)
        const sortedIndices = Array.from(selectedLoopIndices).sort((a, b) => a - b);
        
        // 2. Generate Q1 (Fill Blank) and Q3 (Translation) for EACH selected line
        sortedIndices.forEach(lineIdx => {
            // Question 1: Fill in the blank (Current Line)
            quizQueue.push(generateQuizData(lineIdx, 0.4));
            
            // Question 3: Vietnamese Translation (Current Line)
            quizQueue.push(generateTranslationQuizData(lineIdx));
        });

        // 3. Update Title
        document.getElementById('quiz-title').innerText = `Luyện Tập (${sortedIndices.length} câu chọn)`;

    } else {
        // === ORIGINAL LOGIC: SINGLE LINE MODE ===
        
        // Question 1: Fill Blank (Current Line)
        quizQueue.push(generateQuizData(idx, 0.4));

        // Question 2: Previous Sentence (if exists) - Only for standard Check/Practice
        if (idx > 0) {
            quizQueue.push(generateQuizData(idx - 1, 0.4));
        }
        
        // Question 3: Translation
        quizQueue.push(generateTranslationQuizData(idx));

        // Set Title based on mode
        if (mode === 'check') {
            document.getElementById('quiz-title').innerText = "Kiểm Tra Học Thuộc";
        } else if (mode === 'practice') {
            document.getElementById('quiz-title').innerText = "Luyện Tập";
        }
    }

    currentQuizIndex = 0;
    openQuizModal();
}

function openQuizModal() {
    document.getElementById('quiz-modal').style.display = 'flex';
    renderQuizStep();
}

function closeQuizModal() {
    document.getElementById('quiz-modal').style.display = 'none';
    quizQueue = [];
}

function renderQuizStep() {
    const data = quizQueue[currentQuizIndex];
    const total = quizQueue.length;
    
    // Update Progress
    document.getElementById('quiz-progress').innerText = `Câu ${currentQuizIndex + 1}/${total}`;
    document.getElementById('btn-quiz-next').disabled = true;
    document.getElementById('btn-quiz-next').innerText = (currentQuizIndex === total - 1) ? "Hoàn thành" : "Tiếp tục";
    document.getElementById('btn-quiz-reset').style.display = 'none';

    const sentenceArea = document.getElementById('quiz-sentence-area');
    const optionsArea = document.getElementById('quiz-options-area');
    const instructionText = document.getElementById('quiz-instruction-text'); // Target the instruction
    
    sentenceArea.innerHTML = '';
    optionsArea.innerHTML = '';

    // === NẾU LÀ CÂU HỎI TRẮC NGHIỆM TIẾNG VIỆT ===
    if (data.type === 'translation') {
        
        // Cập nhật câu hướng dẫn
        if (instructionText) instructionText.innerText = "Ý nghĩa Tiếng Việt của câu Pali này?";
        
        // Render Text Question (Removed redundant labels, just keeping the Pali text)
        sentenceArea.innerHTML = `
            <div style="font-weight: bold; color: var(--primary-color); font-size: 20px; text-align: center; padding: 10px 0;">"${data.paliText}"</div>
        `;
        
        // Đặt layout dọc cho các đáp án dài
        optionsArea.style.flexDirection = 'column';
        optionsArea.style.alignItems = 'stretch';
        
        data.options.forEach((opt, i) => {
            const btn = document.createElement('div');
            btn.className = 'quiz-option translation-option';
            btn.innerText = opt;
            btn.dataset.optIndex = i;
            
            // Giữ trạng thái chọn nếu render lại
            if (data.userAnswer === opt) {
                btn.style.backgroundColor = 'var(--highlight-color)';
                btn.style.color = '#fff';
            }
            
            btn.onclick = () => selectTranslationOption(opt, btn);
            optionsArea.appendChild(btn);
        });
    } 
    // === NẾU LÀ CÂU HỎI ĐIỀN TỪ (MẶC ĐỊNH CŨ) ===
    else {
        
        // Cập nhật câu hướng dẫn về mặc định
        if (instructionText) instructionText.innerText = "Chọn từ bên dưới để điền vào chỗ trống:";

        optionsArea.style.flexDirection = 'row'; // Trả về layout cũ
        optionsArea.style.alignItems = 'center';

        // 1. Render Sentence with Blanks
        data.originalWords.forEach((word, i) => {
            if (data.hiddenIndices.includes(i)) {
                const blankIdx = data.hiddenIndices.indexOf(i);
                const span = document.createElement('span');
                span.className = 'quiz-blank';
                span.dataset.wordIndex = i;
                span.dataset.blankIndex = blankIdx;
                span.innerHTML = "&nbsp;&nbsp;&nbsp;";
                
                span.onclick = () => clearBlank(blankIdx);
                sentenceArea.appendChild(span);
            } else {
                const span = document.createElement('span');
                span.innerText = word + " ";
                sentenceArea.appendChild(span);
            }
        });

        // 2. Render Word Bank
        data.wordBank.forEach((word, i) => {
            const btn = document.createElement('div');
            btn.className = 'quiz-option';
            btn.innerText = word;
            btn.dataset.optIndex = i;
            btn.onclick = () => selectOption(i, word);
            optionsArea.appendChild(btn);
        });
    }
}

// Hàm chọn đáp án cho câu hỏi Dịch tiếng Việt
function selectTranslationOption(optText, btnElement) {
    const data = quizQueue[currentQuizIndex];
    if (!data || data.type !== 'translation') return;
    
    data.userAnswer = optText;
    
    // Đặt lại style cho tất cả các nút
    const allOpts = document.querySelectorAll('.translation-option');
    allOpts.forEach(el => {
        el.style.backgroundColor = '';
        el.style.color = '';
    });
    
    // Highlight nút được chọn
    btnElement.style.backgroundColor = 'var(--highlight-color)';
    btnElement.style.color = '#fff';
    
    checkStepCompletion();
}

function selectOption(optIndex, word) {
    const data = quizQueue[currentQuizIndex];
    
    // Find first empty blank
    const emptyBlankIndex = data.userAnswers.findIndex(ans => ans === null);
    
    if (emptyBlankIndex === -1) return; // All full

    // Fill data
    data.userAnswers[emptyBlankIndex] = { word: word, optIndex: optIndex };
    
    // Update UI
    const blankEl = document.querySelector(`.quiz-blank[data-blank-index="${emptyBlankIndex}"]`);
    blankEl.innerText = word;
    blankEl.classList.add('filled');
    blankEl.classList.remove('error');

    // Mark option used
    const optEl = document.querySelector(`.quiz-option[data-opt-index="${optIndex}"]`);
    optEl.classList.add('used');

    checkStepCompletion();
}

function clearBlank(blankIdx) {
    const data = quizQueue[currentQuizIndex];
    const answer = data.userAnswers[blankIdx];
    
    if (!answer) return;

    // Restore option
    const optEl = document.querySelector(`.quiz-option[data-opt-index="${answer.optIndex}"]`);
    if(optEl) optEl.classList.remove('used');

    // Clear data
    data.userAnswers[blankIdx] = null;

    // Clear UI
    const blankEl = document.querySelector(`.quiz-blank[data-blank-index="${blankIdx}"]`);
    blankEl.innerHTML = "&nbsp;&nbsp;&nbsp;";
    blankEl.classList.remove('filled', 'error');
    
    checkStepCompletion();
}

function checkStepCompletion() {
    const data = quizQueue[currentQuizIndex];
    const btnNext = document.getElementById('btn-quiz-next');
    
    if (data.type === 'translation') {
        if (data.userAnswer !== null) {
            btnNext.disabled = false;
            btnNext.onclick = validateCurrentQuestion;
        } else {
            btnNext.disabled = true;
        }
    } else {
        const isFull = data.userAnswers.every(ans => ans !== null);
        if (isFull) {
            btnNext.disabled = false;
            btnNext.onclick = validateCurrentQuestion;
        } else {
            btnNext.disabled = true;
        }
    }
}

function validateCurrentQuestion() {
    const data = quizQueue[currentQuizIndex];
    let isCorrect = true;

    if (data.type === 'translation') {
        isCorrect = (data.userAnswer === data.correctTranslation);
        
        // Highlight Đúng/Sai
        const allOpts = document.querySelectorAll('.translation-option');
        allOpts.forEach(el => {
            // FIX: Only apply colors to the option the user actually clicked
            if (el.innerText === data.userAnswer) {
                if (isCorrect) {
                    el.style.backgroundColor = '#27ae60'; // Xanh lá = Đúng
                    el.style.color = 'white';
                    el.style.borderColor = '#27ae60';
                } else {
                    el.style.backgroundColor = '#c0392b'; // Đỏ = Sai
                    el.style.color = 'white';
                    el.style.borderColor = '#c0392b';
                }
            }
        });
    } else {
        // Logic kiểm tra câu điền từ cũ
        data.hiddenIndices.forEach((wordIdx, i) => {
            const correctWordClean = cleanPaliWord(data.originalWords[wordIdx]);
            const userWord = data.userAnswers[i] ? data.userAnswers[i].word : ""; 
            const blankEl = document.querySelector(`.quiz-blank[data-blank-index="${i}"]`);

            if (correctWordClean !== userWord) {
                isCorrect = false;
                blankEl.classList.add('error');
            } else {
                blankEl.classList.remove('error');
                blankEl.classList.add('filled');
            }
        });
    }

    if (isCorrect) {
        if (currentQuizIndex < quizQueue.length - 1) {
            // Đợi 1 giây để người dùng nhìn thấy đáp án xanh lá rồi mới qua câu
            setTimeout(() => {
                currentQuizIndex++;
                renderQuizStep();
            }, 1000); 
        } else {
            setTimeout(finishQuizSuccess, 1000);
        }
    } else {
        const btnReset = document.getElementById('btn-quiz-reset');
        btnReset.style.display = 'inline-block';
        document.getElementById('btn-quiz-next').disabled = true;
        if (navigator.vibrate) navigator.vibrate(200);
    }
}

function resetCurrentQuestion() {
    const data = quizQueue[currentQuizIndex];
    if (data.type === 'translation') {
        data.userAnswer = null;
    } else {
        data.userAnswers.fill(null);
    }
    renderQuizStep(); 
}

function finishQuizSuccess() {
    // 1. Logic for "Check Mode" (Đã thuộc)
    if (!isSectionExam && !isPracticeMode && currentTargetLineIndex !== -1) {
        const checkbox = document.getElementById(`checkbox-${currentTargetLineIndex}`);
        if (checkbox) checkbox.checked = true;
        saveLineScore(currentTargetLineIndex, 100);
    }

    // 2. XP REWARD
    const currentSectionId = sections[currentSectionIndex].id;
    let xpEarned = quizQueue.length; // Default base
        alert(`Luyện tập hoàn thành! Bạn nhận được +${quizQueue.length} XP.`);
 

    addSectionXP(currentSectionId, xpEarned);

    // 3. Cleanup
    closeQuizModal();
    
    setTimeout(() => {
        if (isSectionExam) {
            completeSectionExam();
        } else {
            updateOverallStats(); 
        }
    }, 150); 
}
function navigateRecitation(d) {
        // 1. Check if audio is currently playing before we do anything
        const isPlaying = !audioPlayer.paused && !audioPlayer.ended;
        
        // 2. Clear the existing timer so we don't have overlapping jumps
        if (recitationTimeout) { clearTimeout(recitationTimeout); recitationTimeout = null; }
        
        // 3. Activate recitation mode if it wasn't already (Edge case)
        if (!displayArea.classList.contains('recitation-active')) { 
            startRecitationMode();
        }
        
        // 4. Update the line index
        currentRecitationLine += d;
        if (currentRecitationLine < 0) currentRecitationLine = 0;
        if (currentRecitationLine >= allLines.length) currentRecitationLine = allLines.length - 1;

        // 5. Show the new line visually
        showRecitationLine(currentRecitationLine);

        // 6. Sync the audio to the start time of the new line
        const targetEl = allLines[currentRecitationLine];
        const startTimeSeconds = parseFloat(targetEl.dataset.startTime || 0);
        audioPlayer.currentTime = startTimeSeconds; 
        
        // 7. Decide logic based on previous state
        if (isPlaying) {
            // If it was playing:
            // We do NOT pause. We just restart the sync timer (runRecitationStep)
            // so it counts down the duration of this new line correctly.
            runRecitationStep();
        } else {
            // If it was paused:
            // Keep it paused and show the "Manual" (Play button) state.
            updateButtonVisuals('manual');
        }
    }

    // --- CÁC HÀM PHỤ ---
    function hideRandomWords() {
        const wasActive = displayArea.classList.contains('recitation-active');
        resetText(true);
        const words = document.querySelectorAll('.word');
        const count = Math.floor(words.length * (document.getElementById('difficulty').value / 100));
        Array.from({length: words.length}, (_, i) => i).sort(() => Math.random()-.5).slice(0, count).forEach(i => words[i].classList.add('hidden'));
        
        if (wasActive) {
            displayArea.classList.add('recitation-active');
            updateButtonVisuals('manual');
        }
    }
    
    function resetText(keep = false) {
        if (!keep) exitRecitation();
        document.querySelectorAll('.word').forEach(w => w.classList.remove('hidden', 'revealed'));
    }

    function toggleSettings() { settingsPanel.classList.toggle('open'); }
    function updateLabel(v) { document.getElementById('difficulty-label').innerText = v + "%"; }
    
    // --- CÁC HÀM MỚI CHO TỐC ĐỘ ---

    function toggleSpeedControl() {
        document.getElementById('btn-show-speed').style.display = 'none';
		document.getElementById('btn-show-speed2').style.display = 'none';
        document.getElementById('speed-control-area').style.display = 'flex';
    }

    function updateRecitationInterval(v) { 
        const newIntervalSeconds = parseFloat(v);
        localStorage.setItem('overrideInterval', newIntervalSeconds.toFixed(1)); 
        
        document.getElementById('recitation-interval-label').innerText = newIntervalSeconds.toFixed(1) + "s";
        loadSection(currentSectionIndex); 
        if(!audioPlayer.paused && displayArea.classList.contains('recitation-active')) audioPlayer.pause();
    }

    function resetSpeedDefault() {
        localStorage.removeItem('overrideInterval');
        document.getElementById('recitation-interval').value = 3;
        document.getElementById('recitation-interval-label').innerText = "3.0s";
        document.getElementById('speed-control-area').style.display = 'none';
        document.getElementById('btn-show-speed').style.display = 'inline-block';
		document.getElementById('btn-show-speed2').style.display = 'inline-block';
        loadSection(currentSectionIndex);
    }
    
    function toggleTheme() {
        const body = document.body;
        const btn = document.querySelector('.btn-darkmode');
        const isDark = body.getAttribute('data-theme') === 'dark';

        if (isDark) {
            body.removeAttribute('data-theme');
            btn.innerHTML = '<i class="fas fa-moon"></i>';
            localStorage.setItem('themePreference', 'light');
        } else {
            body.setAttribute('data-theme', 'dark');
            btn.innerHTML = '<i class="fas fa-sun-bright"></i>';
            localStorage.setItem('themePreference', 'dark');
        }
    }

    init();
