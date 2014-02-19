#include "n_built_in_image_importer.h"
#include "ui_n_built_in_image_importer.h"

#include <QLabel>
#include <QDebug>
#include <QFileInfo>
#include <n_project.h>
#include <QMessageBox>

#include <util/n_util.h>

NBuiltInImageImporter::NBuiltInImageImporter(QWidget *parent) : QDialog(parent), ui(new Ui::NBuiltInImageImporter)
{
    ui->setupUi(this);

    setupImageWidget();

    connect(ui->treeWidget, SIGNAL(itemDoubleClicked(QTreeWidgetItem*,int)), this, SLOT(importImage(QTreeWidgetItem*)));
}

void NBuiltInImageImporter::setupImageWidget() {
    NProject *project = NProject::instance();

    QStringList paths = NUtil::recursiveEntryList(":/built_in_image", "");
    foreach (QString path, paths) {
        QString srcPath = ":/built_in_image/"  + path;
        if(!QFileInfo(srcPath).isFile()) {
            continue;
        }

        QString relativePath = "image/" + path;

        // 画像は大きいので1/2にする
        QPixmap pixmap(srcPath);
        int width = pixmap.width() / 2;
        int height = pixmap.height() / 2;

        QLabel *image = new QLabel();
        image->setPixmap(pixmap.scaled(width, height));
        image->setMargin(10);

        QTreeWidgetItem *item = new QTreeWidgetItem();
        ui->treeWidget->addTopLevelItem(item);
        ui->treeWidget->setItemWidget(item, 0, image);
        item->setText(1, relativePath);

        QString dstPath = project->contentsFilePath(relativePath);
        mImageWidgetToDstPath[image] = dstPath;
        mImageWidgetToSrcPath[image] = srcPath;
    }
}

void NBuiltInImageImporter::importImage(QTreeWidgetItem *item) {
    QWidget *widget = ui->treeWidget->itemWidget(item, 0);
    QString srcPath = mImageWidgetToSrcPath[widget];
    QString dstPath = mImageWidgetToDstPath[widget];

    // すでにファイルが存在する場合は上書きするか確認.
    if (QFileInfo(dstPath).exists()) {
        int ret = QMessageBox::question(this, "", "File is already exsit. Do you over write this file?");
        if (ret != QMessageBox::Ok) {
            return;
        }
    }

    bool ret = NUtil::createFileFromTemplate(srcPath, dstPath);
    if (ret) {
        QMessageBox::information(this, "", "Success import.");
    }
}

NBuiltInImageImporter::~NBuiltInImageImporter()
{
    delete ui;
}
