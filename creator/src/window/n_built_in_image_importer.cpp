#include "n_built_in_image_importer.h"
#include "ui_n_built_in_image_importer.h"

#include <QLabel>
#include <QDebug>
#include <QFileInfo>

#include <util/n_util.h>

NBuiltInImageImporter::NBuiltInImageImporter(QWidget *parent) : QDialog(parent), ui(new Ui::NBuiltInImageImporter)
{
    ui->setupUi(this);

    setupImageWidget();
}

void NBuiltInImageImporter::setupImageWidget() {
    QStringList paths = NUtil::recursiveEntryList(":/built_in_image", "");
    foreach (QString path, paths) {
        QString absPath = ":/built_in_image/"  + path;
        if(!QFileInfo(absPath).isFile()) {
            continue;
        }

        // 画像は大きいので1/2にする
        QPixmap pixmap(absPath);
        int width = pixmap.width() / 2;
        int height = pixmap.height() / 2;

        QLabel *image = new QLabel();
        image->setPixmap(pixmap.scaled(width, height));
        image->setMargin(10);

        QTreeWidgetItem *item = new QTreeWidgetItem();
        ui->treeWidget->addTopLevelItem(item);
        ui->treeWidget->setItemWidget(item, 0, image);
        item->setText(1, "image/" + path);
    }
}

NBuiltInImageImporter::~NBuiltInImageImporter()
{
    delete ui;
}
