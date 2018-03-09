This repository holds the source code of [MunchkinDB](https://munchkindb.com).

# This is not where the cards data is

The data used by MunchkinDB is at https://github.com/CallidusAsinus/munchkin-cards-json. If you want to fix a mistake in some card data, or add the data of a new card, you can submit a PR [there](https://github.com/CallidusAsinus/munchkin-cards-json/pulls). Also, that's where the localized data is.

# Installing a local copy of MunchkinDB

## Prerequisite

- you need a recent apache/php/mysql stack
- your php module must be configured with `mbstring.internal_encoding = UTF-8`

## How to install

- Go into the directory where your server will reside
- Clone the repository (or your own fork)
- This creates a directory named `munchkindb`
- Also, clone the data repository (or your own fork) at https://github.com/CallidusAsinus/munchkin-cards-json
- Go into it the directory `munchkindb`
- Install Composer (see https://getcomposer.org/download/)
- Install the vendor libs: `composer install`. You'll be asked to input your database connection parameter.
- Create the database: `php app/console doctrine:database:create`
- If the above command fails, edit app/config/parameters.yml and try again
- Create the tables: `php app/console doctrine:schema:update --force`
- Import all the data from the data repository: `php app/console nrdb:import:std path_to_json_repository`
- [Configure your web server with the correct DocumentRoot](http://symfony.com/doc/current/cookbook/configuration/web_server_configuration.html). Alternatively, [use PHP's built-in Web Server](http://symfony.com/doc/current/cookbook/web_server/built_in.html). Set your DocumentRoot to `munchkindb/web`
- Point your browser to `/app_dev.php`

## How to add card images

- Put the card images in `web/card_image/` (`web/card_image/01001.png`, etc.)

## How to update

When you update your repository (`git pull`), run the following commands:

- `composer self-update`
- `composer install` (do *not* run `composer update`)
- `php app/console doctrine:schema:update --force`
- `php app/console nrdb:import:std path_to_json_repository`

## Deck of the Week

To update the deck of the week on the front page:

- `php app/console nrdb:highlight decklist_id` 

where `decklist_id` is the numeric id of the deck you want to highlight.

## Setup an admin account

- register
- make sure your account is enabled (or run `php app/console fos:user:activate <username>`)
- run `php app/console fos:user:promote --super <username>`

## Add or edit cards

- update the json data
- run `php app/console nrdb:import:json path_to_json_repository`
