=== FlexTable Pro ===
Contributors: wppool, devsabbirahmed, mahfuz01, azizultex, wpdarkmode
Tags: spreadsheet, google spreadsheet, live table, gutenberg blocks, tables
Requires at least: 5.0
Tested up to: 6.7
Requires PHP: 5.4
Stable tag: 3.14.0
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html


== Changelog ==

= 3.14.0 - 31 December 2024 =
* **New:** Added Freeze Header and Columns feature, allowing table headers and specific columns to stay sticky while scrolling.  
* **New:** Introduced the ability to create custom themes and apply them globally across all tables.  
* **New:** Added tutorial video CTA for Search-Only Display feature.  
* **Tweak:** Refined the user interface for a cleaner and more modern appearance. 

= 3.13.0 - 03 December 2024 =
* **New: Default Table Sorting on Load:** Introducing the ability to set a default sorting order for tables. Users can now define how their tables should be sorted when the page loads, improving data presentation and usability.  
* **New: Enhanced Timeout Settings:** A new global timeout configuration is now available under the Performance tab. This setting allows users to extend the request timeout duration, ensuring smoother handling of larger or slower data queries.  
* **New: Google Sheets Line Break Support:** The plugin now fully supports line breaks within cells of Google Sheets. This enhancement improves data formatting and ensures seamless integration of multi-line content.  
* **Fix: Color and Style Import for Large Datasets:** Resolved issues related to importing colors and styles for large data sheets. The process is now more reliable and efficient, ensuring accurate data representation.  
* **Fix: Accurate Date Sorting in DataTables:** Addressed incorrect date sorting issues within DataTables. Dates are now properly sorted, providing accurate and intuitive ordering.  
* **Improvement: Enhanced Tag Management:** Tags have been improved for better organization and usability.  
* **Improvement: Tab Title Formatting:** Tab titles now consistently follow the user-defined input formatting. Previously enforced sentence case formatting has been updated to respect custom title input, offering greater flexibility. 

= 3.12.3 - 01 December 2024 =
* **Enhancement:** Updated Appsero notice that clarifies what data we collect to help users understand what they are sharing.

= 3.12.2 - 25 November 2024 =
* **Fix:** Resolved issue with the _load_textdomain_just_in_time error caused by premature loading of translations.

= 3.12.1 - 29 September 2024 =
* **New: Checkbox functionality:** You can now display checkboxes directly in the frontend tables from the Google Sheets.
* **Fix: Zero value handling:** You can now input zero (0) values directly into the table from the sheet. No more hassle!

= 3.12.0 - 05 September 2024 =
`We've Changed our Branding!`
**Sheets to WP Table Live Sync** is now **FlexTable**! We believe this new name better represents the powerful functionality and flexibility that set our plugin apart. Enjoy!
* Fix: Fixed Theme-builder custom theme background color not reflecting in frontend.
* Fix: Fixed model not showing properly in laptop screen.

= 3.11.0 - 01 September 2024 =
* **New: Theme-wise Pagination:** Simply creating gorgeous tables isn't enough. Achieve your ideal pagination style - Default, Modern, Minimal, Tailwind, or Outlined. You can also customize the active pagination color and position the pagination at the middle or bottom right.

= 3.10.0 - 30 July 2024 =
* **New:🔥 Customize Table Theme:**  With table theme customization, you can customize any table theme-template and personalize the header, body, text, and border colors.
* **New: 🎨 Table Theme Builder:** Create your own theme to display the best version of your table! With an in-built table builder, get creative and customize every section of your table. Once you create a theme, it’s yours. Use the theme for any other tables later on as well.

= 3.9.0 - 02 June 2024 =
* **New:** Added an ascending/descending sorting option inside the dashboard for easier table ordering.
* **New:** Introduced the duplicate tables/tabs feature, making it simpler to manage your content.
* **New:** Launched a new theme called "Uppercase Elegant" for a sleek, modern appearance.
* **Fix:** Resolved an issue where the table screen size would reduce when zooming in or out, ensuring consistent table display.
* **Improvement:** Enhanced the table preset compatibility with WordPress default theme and Spectra Theme for a smoother integration.

= 3.8.0 - 20 May 2024 =
* **New:** Introduced a new theme called "Minimal" for a clean and simple look.
* **New:** Introduced another new theme named "Dark Knight" for a sleek, modern appearance.
* **New:** Added table description - you can now add table descriptions above or below your tables for better context and clarity.
* **Improvement:** Enhanced the appearance and flow of existing themes for a more seamless and visually appealing experience.

= 3.7.1 - 06 May 2024 =
* Fix: Resolved conflict issue between stepper buttons (Next/Back)
* Improvement: Enhanced hiding mechanism and introduced "same as desktop mode" toggle feature
* Improvement: Implemented global save button located at the top-right corner on setting page

= 3.7.0 - 24 Apr 2024 =
* New: Added wizards (stepper) to the table editor and tab editor page
* New: Added row and cell hiding for mobile devices
* Fix: Fixed Appsero updater problem 
* Fix: Fixed Cursor behavior inside the table with default mode
* Improvement: Enhanced overall UI/UX of settings page and table creation flow

= 3.6.1 - 04 APR 2024 =
* Improvement: Enhanced compatibility to support WordPress 6.5

= 3.6.0 - 21 MAR 2024 =
* Tweak: Added more table customization options for Free users.
* Fix: Resolved issue causing JSON imports during preview, ensuring seamless data integration for users.
* Fix: Fixed table breakage occurrences when headers were merged within the table, ensuring uninterrupted data presentation.

= 3.5.3 - 12 MAR 2024 =
* Fix: Fixed link and Images feature not working for few google sheets

= 3.5.2 - 22 FEB 2024 =
* Improvement: Enhanced Theme Style on the frontend for a more polished appearance
* Improvement: Enhanced the User Interface for notices, providing a more refined and user-friendly experience

= 3.5.1 - 13 FEB 2024 =
* Fix: Resolved Appsero fatal error
* Fix: Addressed an Elementor page builder conflict issue 

= 3.5.0 - 07 FEB 2024 =
* New: Added new Script Loading behavior as a Performance feature
* New: Added new review/rating notice
* Improvement: Enhanced style css files

= 3.4.1 - 17 JAN 2024 =
* New: Added Cursor behavior feature for WP table
* Improvement: Enhanced Preview sorting feature
* Fix: Passing null to parameter #1 () of type string is deprecated
* Fix: Resolved DataTable auto translation constant breaks the strings data

= 3.4.0 - 03 JAN 2024 =
* New: Added "Merge Cells" feature for WP table
* Improvement: Enhanced the sorting feature
* Improvement: Improved the on-hover color of the "Delete" button of table
* Fix: Resolved table design broken issue in frontend

= 3.3.0 - 28 NOV 2023 =
* New: Added support popup functionality
* New: Introduced a new Notice feature
* New: Built pot files for Translation support
* Fix: Updated Support UI links for better navigation
* Fix: Fixed an issue with the Sorting feature
* Fix: Resolved conflicts related to Importing Images from Sheet
* Fix: Addressed an Appsero-related issue

= 3.2.0 - 08 NOV 2023 =
* New: Added a FAQ section
* Improvement: Plugin loading performance
* Improvement: Import links and images from sheet
* Improvement: Replaced the "import style" feature to Theme section
* Improvement: "UPGRADE NOW" menu positioning
* Improvement: "Documentation" menu renamed to "Get Started"
* Improvement: Updated popup design 

= 3.1.0 - 16 OCT 2023 =
* New: Smart link support is now available
* New: You can now embed all supported link types within "RichText", including both Smart link and Pretty link options
* New: Added support for mailto:yourmail@google.com links to redirect emails on click
* Fix: Users of the FREE version can now create multiple tables from the same Google Sheet link
* Fix: Resolved an issue where the sort icon was not appearing in the table preview within the backend
* Improvement: Updated the design of the "UPGRADE NOW" menu for a better user experience

= 3.0.1 - 26 SEP 2023 =
* Improvement: Code refactoring of Generating Tables

= 3.0.0 - 13 SEP 2023 =
* Improvement: Full UI/UX and performance improved

= 2.14.2 - 17 APR 2023 =
* FIXED: table html generation php warning
* Minor bug fixes

= 2.14.1 - 14 MAR 2023 =
* FIXED: Bug fixes and performance enhancement

= 2.14.0 - 22 FEB 2023 =
* ADDED: Code refactoring
* FIXED: Minor bug fixes and performance enhancement

= 2.13.0 =
* Updated: Added compatibility with free version

= 2.12.0 =
* New: Added tab management feature. 🔥
* Updated: Popup offer api modified
* Fixed: Fixed url conflict issue for image loading.
* Fixed: Fixed $ error with other plugins
* Fixed: Fixed PHP 8 error
* Fixed: Fixed PDF generation script

= 2.11.0 =
* New: Added image loading from URL. 🔥
* New: Added automatic detection of line breaks. 🔥
* New: Added iframe video support. 🔥
* Removed: Removed Multiple sheet tab option and made it default
* Fixed: Fixed some bug.
* Fixed: Fixed Elementor settings popup height issue.

= 2.10.0 =
* New: Added import of all styles in sheet.
* New: Added affiliate popup.
* Updated: Modifed some UI/UX
* Fixed: Fixed elementor header already sent issue.

= 2.9.0 =
* New: Added sheet background  & font color import feature 🔥
* Updated: Re-arranged other product section
* Fixed: Fixed create table bug.

= 2.8.0 =
* New: Added Cell Hiding feature 🔥

= 2.7.0 =
* Fixed: Fixed some error's

= 2.6.0 =
* Improvement: Improved Elementor widget

= 2.5.0 =
* Fixed: Fixed Elementor function depricated issue
* Fixed: Fixed Elementor widget Logo issue

= 2.3.1 =
* New: Added row hide feature & unlocked in pro.

= 2.2.1 =
* Fix: Fixed license deactivation issue on update
* Fix: Fixed collapsible table style issue

= 2.1.3 =
* Fix: Table pagination style fixed
* Fix: Fixed table style image issue

= 2.1.2 =
* Fix: Minor bugs fixed for pro plugin
* Fix: Fixed Elementor page builder exports buttons bug
* Added: Multiple Google Sheet\'s Tab in pro version as a new feature
* Added: Boolean value support in pro version as a new feature
* Added: Table Caching feature introduced in pro version as a new feature
* Added: Added new 6 Table Style (Including Default) in pro version
* Added: Added Custom CSS support for pro version

= 2.0.2 =
* Fix: Minor bugs fixed for pro plugin
* Added: Added Format Table Cell feature in pro plugin
* Added: Added Link Support feature in pro plugin
* Added: Added plugin review reminder option in 1 day after activation
* Added: Removed doc page from dashboard page
* Improvement: Improved Gutenberg Table creation
* Improvement: Improved table creation with 1 step reduced
* Improvement: Other minor improvement for pro plugin

= 1.0.2 =
* Fix: Fixed some minor issues

= 1.0.1 =
* Fix: Fixed pro plugin license issue
* Fix: Fixed license page menu issue

= 1.0.0 =
* Initial Release