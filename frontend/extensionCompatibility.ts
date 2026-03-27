// Auto-generated file - Do not edit manually
// Generated from compatibility CSV

export type CompatibilityStatus = 'Perfect' | 'Great' | 'Okay' | 'Broken';

const extensionCompatibility: Record<string, CompatibilityStatus> = {
  ddkjiahejlhfcafbddmgiahcphecmpfh: 'Great',
  cjpalhdlnbpafiamejdnhcphjbkeiagm: 'Great',
  dhdgffkkebhmkfjojejmpbldmpobfkfo: 'Broken',
  eimadpbcbfnmbkopoojfekhnkhdbieeh: 'Perfect',
  cmeakgjggjdlcpncigglobpjbkabhmjl: 'Okay',
  jjicbefpemnphinccgikpdaagjebbnhg: 'Perfect',
  kdbmhfkmnlmbkgbabkdealhhbfhlmmon: 'Perfect',
  dnhpnfgdlenaccegplpojghhmaamnnfp: 'Great',
  kaibcgikagnkfgjnibflebpldakfhfih: 'Okay',
  djbgadolfboockbofalipohdncimebic: 'Perfect',
  fkagelmloambgokoeokbpihmgpkbgbfm: 'Great',
  ndcooeababalnlpkfedmmbbbgkljhpjf: 'Great',
  canbadmphamemnmdfngmcabnjmjgaiki: 'Perfect',
  bibdjkcebiliphphjbnkngdjgeklgcdf: 'Perfect',
  kdappijekicdbempkjaahnnmkookhfnj: 'Perfect',
  obgkjikcnonokgaiablbenkgjcdbknna: 'Perfect',
  jecikjbpiedagpmibmgpfgnkfpomgeok: 'Great',
  lfjdaphbejfpncjfebkbcganmkinhhfl: 'Great',
  hgapfodjjnkkoebpfbcfhhenkklchngn: 'Perfect',
  gjhejidajnchnadcangcodljgdmenipa: 'Perfect',
  dhpcikljplaooekklhbjohojbjbinega: 'Perfect',
  ngonfifpkpeefnhelnfdkficaiihklid: 'Perfect',
  kkgmmlflilcfcogmfpnhakfamdkdcbpl: 'Perfect',
  ocabaebkfcojookdnihccpcngaaigfan: 'Great',
  lcobepkldcbbjfnpjnonocmlifjdlcdh: 'Perfect',
  clegcobheppnnigaaeelfkeomjcngmnh: 'Perfect',
  cdcfacnigofkflfapbbbpjjipgipnoma: 'Perfect',
  fpijccoohfcbgljdmhmklohjfebfjmif: 'Perfect',
  cmdknlhmnkeilgeekfmndhokneknihmi: 'Perfect',
  hebdfnoheiibmkfobehgdbmilckpjjhl: 'Perfect',
  dimefhnkbbhebmnnhnnaiemghgjkjgpa: 'Perfect',
  fgkeoeoibigdcdkfdckkpodhfhppgdlo: 'Perfect',
} as const;

export function getExtensionCompatibility(extensionId: string): CompatibilityStatus | undefined {
  return extensionCompatibility[extensionId];
}
