import re

def main():
    with open('installation.html', 'r', encoding='utf-8') as f:
        html = f.read()

    # 1. Add CSS
    css = '''
        .accordion-header {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: none;
            border: none;
            cursor: pointer;
            padding: 0;
            text-align: left;
        }
        .accordion-header h2 { margin-bottom: 0 !important; }
        .accordion-icon {
            transition: transform 0.3s ease;
            color: var(--accent-primary);
        }
        .accordion-header.active .accordion-icon {
            transform: rotate(180deg);
        }
        .accordion-content {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.4s ease-out, margin-top 0.4s ease-out, opacity 0.4s ease-out;
            opacity: 0;
        }
        .accordion-content.open {
            opacity: 1;
            margin-top: 20px;
        }
'''
    if '.accordion-header' not in html:
        html = html.replace('</style>', css + '    </style>')

    # 2. Add JS
    js = '''
    <script>
        function toggleAccordion(btn) {
            btn.classList.toggle('active');
            const content = btn.nextElementSibling;
            if (content.style.maxHeight && content.style.maxHeight !== '0px') {
                content.style.maxHeight = '0px';
                content.classList.remove('open');
            } else {
                content.classList.add('open');
                content.style.maxHeight = content.scrollHeight + 100 + 'px';
                // Adjust after transition for responsive resizing
                setTimeout(() => { if(content.classList.contains('open')) content.style.maxHeight = 'none'; }, 400);
            }
        }
        
        // Open the first section by default
        document.addEventListener('DOMContentLoaded', () => {
            const firstBtn = document.querySelector('.accordion-header');
            if(firstBtn) toggleAccordion(firstBtn);
            
            // Re-init lucide icons since we added new ones
            lucide.createIcons();
            
            // Handle toc links
            document.querySelectorAll('.toc a').forEach(a => {
                a.addEventListener('click', (e) => {
                    const id = a.getAttribute('href').substring(1);
                    const section = document.getElementById(id);
                    if(section) {
                        const btn = section.querySelector('.accordion-header');
                        if(btn && !btn.classList.contains('active')) {
                            toggleAccordion(btn);
                        }
                    }
                });
            });
        });
    </script>
'''
    if 'toggleAccordion' not in html:
        html = html.replace('<script>lucide.createIcons();</script>', js)

    # 3. Modify sections
    sections = ['storage', 'handling', 'housing', 'fitting', 'lubrication', 'preload', 'runin', 'maintenance']
    for sec in sections:
        # Find <div class="install-section" id="sec">
        start_marker = f'<div class="install-section" id="{sec}">'
        if start_marker not in html: continue
        
        start_idx = html.find(start_marker)
        if 'accordion-header' in html[start_idx:start_idx+300]: 
            # already processed
            continue

        h2_start = html.find('<h2>', start_idx)
        h2_end = html.find('</h2>', h2_start) + 5
        
        # Find the closing </div> of this section. 
        # It is immediately followed by <hr class="divider"> or </section>
        end_idx1 = html.find('</div>\\n\\n            <hr class="divider">', h2_end)
        end_idx2 = html.find('</div>\\n\\n        </section>', h2_end)
        
        end_idx = end_idx1 if end_idx1 != -1 else end_idx2
        # If still -1, fallback to just finding the next <hr
        if end_idx == -1:
            hr_idx = html.find('<hr class="divider">', h2_end)
            if hr_idx != -1:
                end_idx = html.rfind('</div>', h2_end, hr_idx)
            else:
                end_idx = html.rfind('</div>', h2_end, html.find('</section>', h2_end))
                
        if end_idx != -1:
            h2_content = html[h2_start:h2_end]
            body_content = html[h2_end:end_idx]
            
            new_h2 = f'\\n                <button class="accordion-header" onclick="toggleAccordion(this)">\\n                    {h2_content.strip()}\\n                    <i data-lucide="chevron-down" class="accordion-icon" style="width:28px;height:28px;"></i>\\n                </button>\\n'
            new_body = f'                <div class="accordion-content">\\n{body_content}\\n                </div>\\n            '
            
            html = html[:h2_start] + new_h2 + new_body + html[end_idx:]

    with open('installation.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print('Successfully applied accordions to installation.html')


if __name__ == '__main__':
    main()
