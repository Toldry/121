# Bill candidates for the ~40-bill set

Drawn from every whole-bill plenum vote of the 25th Knesset in the
oknesset.org data (1,909 bills), ranked with `npm run oknesset -- candidates`
and then picked by hand for how directly each bill touches deeply held
convictions. **Nothing here is final.** Mark each row keep / drop, and add
anything missing.

How to read the columns:

- **Vote**: the `KNS_PlenumVote` id of the latest vote on the whole bill
  (`npm run oknesset -- show <id>` prints its tally). The data does not say
  which reading it was; that has to be checked per bill.
- **Result**: for–against (absent) in that vote.
- **Gain**: expected information about which party you match, in bits, from
  a uniform start. 0.75 is the typical pure coalition-against-opposition
  split; higher means the bill also separates parties within a camp.
- **Crossed**: factions whose majority broke from their camp's majority.
  These are the bills that tell parties apart, not just camps.
- **Sal.**: my proposed salience (1–10), which sets how early a bill is shown.

Faction ids: lk Likud, sh Shas, utj United Torah Judaism, rz Religious
Zionism, oy Otzma Yehudit, nm Noam, nh HaYamin HaMamlakhti, ya Yesh Atid,
nu National Unity, yb Yisrael Beiteinu, ra Ra'am, ht Hadash–Ta'al, lb Labor.

> Most 25th-Knesset votes are clean coalition-against-opposition splits.
> A set made only of those would place you in a camp and then stall. The
> rows with a **Crossed** entry carry most of the information between
> parties; I've included as many as stayed on-topic.

## Judiciary and the rule of law

| Vote | Date | Bill | Result | Gain | Crossed | Sal. |
| --- | --- | --- | --- | --- | --- | --- |
| 39785 | 2023-07-24 | Basic Law: The Judiciary — reasonableness standard (**current card `rsn`**) | 64–0 (56, boycott) | — | — | 10 |
| 38298 | 2023-02-20 | Basic Law: The Judiciary (Amendment 3) — judicial selection | 63–47 (10) | 0.72 | — | 9 |
| 38329 | 2023-02-22 | Basic Law: The Override | 62–51 (7) | 0.75 | — | 9 |
| 44612 | 2025-10-29 | Splitting the Attorney General's role | 61–46 (13) | 0.75 | — | 8 |
| 44877 | 2025-12-10 | Who investigates the AG and State Attorney (conflicts of interest) | 56–44 (20) | 0.75 | — | 6 |
| 45066 | 2026-01-14 | Basic Law: The Government — two-term limit for the PM | 39–55 (26) | 0.75 | — | 8 |

## October 7 and accountability

| Vote | Date | Bill | Result | Gain | Crossed | Sal. |
| --- | --- | --- | --- | --- | --- | --- |
| 44661 | 2025-11-12 | State commission of inquiry into October 7 (opposition bill) | 44–52 (24) | 0.75 | — | 10 |
| 44946 | 2025-12-24 | "State-national" commission of inquiry into October 7 (coalition bill) | 53–48 (18) | 0.75 | — | 9 |

## Religion and state

| Vote | Date | Bill | Result | Gain | Crossed | Sal. |
| --- | --- | --- | --- | --- | --- | --- |
| 44959 | 2025-12-24 | Civil marriage (**proposed replacement for card `cu`**) | 36–47 (37) | 0.71 | — | 9 |
| 44754 | 2025-11-19 | Public transport on Shabbat | 43–58 (19) | 0.73 | — | 9 |
| 38311 | 2023-02-22 | Chametz law — banning leavened bread in hospitals on Passover | 60–51 (9) | 0.75 | — | 7 |
| 46248 | 2026-07-13 | Basic Law: Torah Study | 63–52 (5) | 0.74 | — | 9 |
| 45281 | 2026-02-25 | Holy Places — Chief Rabbinate consultation | 56–47 (17) | 0.75 | — | 6 |
| 39577 | 2023-07-12 | Chief Rabbinate — composition of the electing assembly | 27–46 (46) | 0.83 | ra | 5 |
| 43511 | 2025-03-24 | Rabbinical courts — jurisdiction over child support | 58–43 (19) | 0.71 | — | 6 |
| 44081 | 2025-05-19 | Gender-separate tracks in graduate degrees | 48–40 (32) | 0.75 | — | 7 |

## Military service and the Haredi draft

| Vote | Date | Bill | Result | Gain | Crossed | Sal. |
| --- | --- | --- | --- | --- | --- | --- |
| 46670 | 2026-07-14 | Security Service Law (Amendment 28, temporary) — 2026 draft law (**proposed new link for card `dr`**) | 58–54 (8) | — | — | 10 |
| 41147 | 2024-06-26 | Mandatory service for all | 42–63 (15) | 0.73 | ht, ra, nh | 9 |
| 41123 | 2024-06-24 | Raising the exemption age (extension) | 51–47 (22) | 0.75 | — | 7 |
| 42086 | 2024-11-06 | Status of soldiers and national-service volunteers | 61–51 (8) | 0.75 | — | 6 |
| 45071 | 2026-01-14 | Tender preference for employers of reservists | 35–50 (33) | **0.89** | ht, ra, nm | 6 |
| 45220 | 2026-02-11 | Budget support for Haredi education corporations | 30–49 (40) | **0.84** | ht | 8 |
| 38400 | 2023-03-15 | Fair representation of Haredim in public bodies | 33–9 (76) | 0.75 | ht, ra | 6 |
| 42681 | 2025-01-08 | State Haredi education stream | 41–57 (22) | 0.72 | — | 6 |

## Security, terror and the Palestinians

| Vote | Date | Bill | Result | Gain | Crossed | Sal. |
| --- | --- | --- | --- | --- | --- | --- |
| 45858 | 2026-03-30 | Death penalty for terrorists — final vote (**alternative to card `dp`**, which shows the 2023 preliminary reading, vote 38353, 55–9) | 62–48 (9) | 0.75 | yb, utj | 10 |
| 42072 | 2024-11-07 | Deporting families of terrorists | 61–41 (18) | 0.73 | yb | 9 |
| 41222 | 2024-07-03 | Administrative detention for membership in a terror group | 54–51 (15) | 0.73 | nh | 7 |
| 42087 | 2024-11-06 | Freezing PA "pay-for-slay" funds to compensate terror victims | 58–26 (36) | 0.75 | — | 7 |
| 43035 | 2025-02-12 | Replacing "West Bank" with "Judea and Samaria" in law | 33–10 (76) | **0.81** | ya, nu, yb | 7 |
| 45133 | 2026-01-21 | Barring teachers with degrees from PA institutions | 31–10 (78) | 0.76 | ya | 7 |
| 39625 | 2023-07-19 | Expelling students who support terror | 51–33 (36) | 0.72 | — | 7 |
| 44646 | 2025-11-10 | "Al Jazeera law" — banning foreign broadcasters, made permanent | 50–41 (29) | 0.72 | — | 8 |
| 43368 | 2025-03-19 | Harsher penalties for illegal entry into Israel | 23–7 (89) | 0.79 | ya, nu, yb | 5 |

## Democracy, minorities and civil society

| Vote | Date | Bill | Result | Gain | Crossed | Sal. |
| --- | --- | --- | --- | --- | --- | --- |
| 41965 | 2024-10-30 | Basic Law: The Knesset — wider grounds to bar lists from elections | 61–35 (24) | 0.73 | yb | 9 |
| 43093 | 2025-02-19 | NGOs — taxing donations from foreign states | 47–19 (54) | 0.73 | yb | 8 |
| 39633 | 2023-07-19 | Basic Law: Human Dignity — adding the right to equality | 50–54 (16) | 0.75 | — | 9 |
| 40370 | 2024-02-07 | Wider powers against crime organisations (crime in Arab towns) | 46–28 (45) | **0.84** | nu | 7 |
| 42251 | 2024-11-27 | Privatising the public broadcaster (Kan) | 49–46 (25) | 0.75 | — | 8 |
| 46611 | 2026-07-16 | Communications (Broadcasting) Law — media regulation overhaul | 53–48 (17) | 0.74 | — | 7 |
| 44819 | 2025-12-03 | Basic Law: The Knesset — minimum representation of both sexes on lists | 45–54 (21) | 0.75 | — | 7 |

## Economy, health and everyday life

| Vote | Date | Bill | Result | Gain | Crossed | Sal. |
| --- | --- | --- | --- | --- | --- | --- |
| 43638 | 2025-03-24 | 2025 state budget | 66–52 (2) | 0.75 | nm | 7 |
| 40922 | 2024-04-03 | Climate law | 49–32 (39) | 0.73 | yb | 6 |
| 46364 | 2026-07-01 | Presumed consent for organ donation | 24–53 (43) | 0.72 | — | 7 |
| 42972 | 2025-02-05 | Guards carry guns off-duty by default | 27–10 (82) | 0.72 | ya | 5 |
| 44949 | 2025-12-24 | Banning smartphones in schools | 33–44 (43) | 0.75 | — | 5 |

## The existing prototype cards

| Card | Status |
| --- | --- |
| `rsn` reasonableness | Linked to 39785 and imported. Card text matches the vote. |
| `dp` death penalty | Linked to 38353 (2023 preliminary, 55–9) and imported. Consider moving to 45858 (2026 final). |
| `dr` draft | Not linked. Its "continuity vote 63–57, June 2024" was not found; 46670 (2026 law) is the likely replacement. |
| `cu` civil unions | Not linked. No 25th-Knesset vote matched; civil marriage (44959) is the nearest real vote. |

That is 44 rows in total. Dropping 4–6 gives the ~40 set.
