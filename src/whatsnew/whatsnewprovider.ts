import {ChangeLogItem, ChangeLogKind, ContentProvider, Header, Image, Sponsor /*, IssueKind*/} from "../3rdparty/vscode-whats-new/src/ContentProvider";

// Provide "Whatsnew" data
export class WhatsNewContentProvider implements ContentProvider {

	provideHeader(logoUrl: string): Header {
		return <Header>{
			logo: <Image>{src: logoUrl, height: 50, width: 50},
			message: `<b>ASM Code Lens<b> provides completion, references, hovering, renaming and outline view for assembly languages.`};
	}

	provideChangeLog(): ChangeLogItem[] {
		let changeLog: ChangeLogItem[]=[];
		changeLog.push(...[
			{
				kind: ChangeLogKind.NEW, detail: {
					message: `<b>Hexadecimal Calculator for sidebar added.
					<img src="assets/hexcalculator.gif"></img>
					<img src="../assets/hexcalculator.gif"></img>
					<img src="../../assets/hexcalculator.gif"></img>
					<img src="../../../assets/hexcalculator.gif"></img>
					<img src="../../../../assets/hexcalculator.gif"></img>
					</b>`
				}
			}
		]);
		return changeLog;
	}

	provideSponsors(): Sponsor[] {
		return [];
	}

}
