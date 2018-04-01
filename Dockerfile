FROM php:7.1-apache

RUN apt-get -y update
RUN apt-get -y install git zip unzip

RUN apt-get install -y libpq-dev libsqlite3-dev
RUN docker-php-ext-configure pgsql -with-pgsql=/usr/local/pgsql
RUN docker-php-ext-install pdo pdo_mysql pgsql pdo_pgsql pdo_sqlite

ADD docker/files/install-composer.sh /install-composer.sh
RUN chmod -v +x /install-composer.sh

ADD docker/files/start.sh /start.sh
RUN chmod -v +x /start.sh

ADD docker/files/sync.sh /sync.sh
RUN chmod -v +x /sync.sh

RUN docker-php-source extract
RUN cp /usr/src/php/php.ini-production /usr/local/etc/php/php.ini

COPY . /var/www/html/
COPY ./docker/files/parameters.yml /var/www/html/app/config/
COPY ./docker/files/app_dev.php /var/www/html/web/

RUN sh /install-composer.sh
RUN php composer.phar install
RUN php composer.phar require symfony/apache-pack

COPY ./docker/files/htaccess /var/www/html/.htaccess
RUN chmod 755 /var/www/html/.htaccess

RUN ln -s /etc/apache2/mods-available/rewrite.load /etc/apache2/mods-enabled/rewrite.load
RUN ln -s /etc/apache2/mods-available/expires.load /etc/apache2/mods-enabled/

RUN chmod -R 777 /var/www/html/app/
RUN chmod -R 777 /var/www/html/web/
RUN chmod -R 777 /var/www/html/src/

CMD ["/start.sh"]
