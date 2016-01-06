'use strict';

// Based on pretty-data (https://github.com/vkiryukhin/pretty-data)
export class XmlFormatter {
    constructor(preferSpaces?: boolean, tabSize?: number, newLine?: string) {
        if (typeof preferSpaces === 'undefined') {
            preferSpaces = false;
        }
        
        tabSize = tabSize || 4;
        newLine = newLine || '\n';
        
        this.newLine = newLine || '\n';
        this.indentPattern = (preferSpaces) ? ' '.repeat(tabSize) : '\t';
    }
    
    newLine: string;
    indentPattern: string;
    
    format(xml: string): string {
        xml = this.minify(xml, false);
        
        let parts: string[] = xml
            .replace(/</g,"~::~<")
		    .replace(/xmlns\:/g,"~::~xmlns:")
		    .replace(/xmlns\=/g,"~::~xmlns=")
		    .split('~::~');
            
        let inComment: boolean = false;
        let level: number = 0;
        let output: string = '';
        
        for (let i = 0; i < parts.length; i++) {
            // <!
            if (parts[i].search(/<!/) > -1) {
                output += this._getIndent(level, parts[i]);
                inComment = true;
                
                // end <!
                if (parts[i].search(/-->/) > -1 || parts[i].search(/\]>/) > -1 || parts[i].search(/!DOCTYPE/) > -1) {
                    inComment = false;
                }
            }
            
            // end <!
            else if (parts[i].search(/-->/) > -1 || parts[i].search(/\]>/) > -1) {
                output += parts[i];
                inComment = false;
            }
            
            // <elm></elm>
            else if (/^<\w/.test(parts[i - 1]) && /^<\/\w/.test(parts[i])
                && /^<[\w:\-\.\,]+/.exec(parts[i - 1])[0] == /^<\/[\w:\-\.\,]+/.exec(parts[i])[0].replace('/', '')) {
                
                output += parts[i];
                if (!inComment) level--;
            }
            
            // <elm>
            else if (parts[i].search(/<\w/) > -1 && parts[i].search(/<\//) == -1 && parts[i].search(/\/>/) == -1) {
                output = (!inComment) ? output += this._getIndent(level++, parts[i]) : output += parts[i];
            }
            
            // <elm>...</elm>
            else if (parts[i].search(/<\w/) > -1 && parts[i].search(/<\//) > -1) {
                output = (!inComment) ? output += this._getIndent(level, parts[i]) : output += parts[i];
            }
            
            // </elm>
            else if (parts[i].search(/<\//) > -1) {
                output = (!inComment) ? output += this._getIndent(--level, parts[i]) : output += parts[i];
            }
            
            // <elm />
            else if (parts[i].search(/\/>/) > -1) {
                output = (!inComment) ? output += this._getIndent(level, parts[i]) : output += parts[i];
            }
            
            // <?xml ... ?>
            else if (parts[i].search(/<\?/) > -1) {
                output += this._getIndent(level, parts[i]);
            }
            
            // xmlns
            else if (parts[i].search(/xmlns\:/) > -1 || parts[i].search(/xmlns\=/) > -1) {
                output += this._getIndent(level, parts[i]);
            }
            
            else {
                output += parts[i];
            }
        }
        
        // remove leading newline
        if (output[0] == this.newLine) {
            output = output.slice(1);
        }
            
        else if (output.substring(0, 1) == this.newLine) {
            output = output.slice(2);
        }
        
        return output;
    }
    
    minify(xml: string, removeComments?: boolean): string {
        if (typeof removeComments === 'undefined') {
            removeComments = false;
        }
        
        xml = (removeComments) ? xml.replace(/\<![ \r\n\t]*(--([^\-]|[\r\n]|-[^\-])*--[ \r\n\t]*)\>/g, '') : xml;
        xml = xml.replace(/>\s{0,}</g, '><');
        
        return xml;
    }
    
    private _getIndent(level: number, trailingValue?: string): string {
        trailingValue = trailingValue || '';
        
        return `${this.newLine}${this.indentPattern.repeat(level)}${trailingValue}`;
    }
}