#include "n_config_widget.h"
#include "ui_n_config_widget.h"
#include "edit_json_dialog.h"
#include "nutil.h"

#include <QDebug>
#include <QDir>
#include <QMenu>
#include <QMessageBox>

NConfigWidget::NConfigWidget(QWidget *parent) : QWidget(parent), ui(new Ui::NConfigWidget)
{
    ui->setupUi(this);

    mProjectDir = new QDir(QDir::homePath());
}

void NConfigWidget::setCurrentProject(QString dirPath) {
    mProjectDir->setPath(dirPath);
    mProjectName = mProjectDir->dirName();

    mConfigApp.parseFromFilePath(mProjectDir->absoluteFilePath("config/app.json"));
    mConfigScene.parseFromFilePath(mProjectDir->absoluteFilePath("config/scene.json"));
    mConfigPage.parseFromFilePath(mProjectDir->absoluteFilePath("config/page.json"));

    this->syncAppJsonToWidget();
    this->syncSceneJsonToWidget();

}


void NConfigWidget::saveConfig() {
    if (mProjectName.isEmpty()) {
        return;
    }

    this->syncAppWidgetToJson();
    this->syncSceneWidgetToJson();

    // app.json
    QFile configAppFile(this->mProjectDir->absoluteFilePath("config/app.json"));
    if (!configAppFile.open(QIODevice::ReadWrite | QIODevice::Text)) {
        return;
    }
    configAppFile.write(this->mConfigApp.stringify());

    // scene.json
    QFile configSceneFile(this->mProjectDir->absoluteFilePath("config/scene.json"));
    if (!configSceneFile.open(QIODevice::ReadWrite | QIODevice::Text)) {
        return;
    }
    configSceneFile.write(this->mConfigScene.stringify());
}

void NConfigWidget::newScene() {
    int count = ui->sceneConfigTreeWidget->topLevelItemCount();
    QString suffix = QString::number(count);
    QStringList row;
    NUtil::expand(row, ui->sceneConfigTreeWidget->columnCount());
    row[SCENE_COL_ID] = "Scene" + suffix;
    row[SCENE_COL_CLASS] = "Scene" + suffix;
    row[SCENE_COL_CLASS_FILE] = "code/scene" + suffix + ".js";
    row[SCENE_COL_LAYOUT] = "layout/scene" + suffix + ".json";
    row[SCENE_COL_PAGE] = "Page";
    QTreeWidgetItem *item = new QTreeWidgetItem(row);
    item->setFlags(item->flags() | Qt::ItemIsEditable);
    ui->sceneConfigTreeWidget->insertTopLevelItem(count, item);
}

void NConfigWidget::removeScene() {
    QList<QTreeWidgetItem *> selectedItems = ui->sceneConfigTreeWidget->selectedItems();
    if (selectedItems.length() == 0) {
        return;
    }

    QTreeWidgetItem *item = selectedItems[0];

    QMessageBox msgBox;
    msgBox.setText(tr("Do you remove scene?"));
    msgBox.setInformativeText(item->text(SCENE_COL_ID));
    msgBox.setStandardButtons(QMessageBox::Ok | QMessageBox::Cancel);
    msgBox.setDefaultButton(QMessageBox::Cancel);
    int ret = msgBox.exec();
    if (ret == QMessageBox::Ok) {
        ui->sceneConfigTreeWidget->takeTopLevelItem(ui->sceneConfigTreeWidget->indexOfTopLevelItem(item));
    }
}

void NConfigWidget::contextMenuForConfigApp(QPoint /*point*/) {
    QMenu menu(this);
    menu.addSeparator();
    menu.addAction(tr("&Edit Raw Data"), this, SLOT(editConfigAppJson()));
    menu.exec(QCursor::pos());
}

void NConfigWidget::contextMenuForConfigScene(QPoint /*point*/) {
    QMenu menu(this);
    menu.addAction(tr("&New Scene"), this, SLOT(newScene()));
    menu.addAction(tr("&Remove Scene"), this, SLOT(removeScene()));
    menu.addSeparator();
    menu.addAction(tr("&Edit Raw Data"), this, SLOT(editConfigSceneJson()));
    menu.exec(QCursor::pos());
}

void NConfigWidget::syncAppJsonToWidget() {
    ui->appSizeWidth->setValue(mConfigApp.getInt("size.width"));
    ui->appSizeHeight->setValue(mConfigApp.getInt("size.height"));
    ui->appStartScene->setText(mConfigApp.getStr("start.scene"));
}

void NConfigWidget::syncSceneJsonToWidget() {
    QList<QTreeWidgetItem *> items;
    for (int i = 0; i < mConfigScene.length(); i++) {
        NJson scene = mConfigScene.getObject(QString::number(i));
        QStringList row;
        NUtil::expand(row, ui->sceneConfigTreeWidget->columnCount());
        row[SCENE_COL_ID] = scene.getStr("id");
        row[SCENE_COL_CLASS] = scene.getStr("class");
        row[SCENE_COL_CLASS_FILE] = scene.getStr("classFile");
        row[SCENE_COL_LAYOUT] = scene.getStr("extra.contentLayoutFile");
        row[SCENE_COL_PAGE] = scene.getStr("extra.page");
        QTreeWidgetItem *item = new QTreeWidgetItem(row);
        item->setFlags(item->flags() | Qt::ItemIsEditable);
        items.append(item);
    }
    ui->sceneConfigTreeWidget->clear();
    ui->sceneConfigTreeWidget->addTopLevelItems(items);
}

void NConfigWidget::syncAppWidgetToJson() {
    mConfigApp.set("size.width", ui->appSizeWidth->value());
    mConfigApp.set("size.height", ui->appSizeHeight->value());
    mConfigApp.set("start.scene", ui->appStartScene->text());
}

void NConfigWidget::syncSceneWidgetToJson() {
    mConfigScene.clear();
    for (int i = 0; i < ui->sceneConfigTreeWidget->topLevelItemCount(); i++) {
        QTreeWidgetItem *item = ui->sceneConfigTreeWidget->topLevelItem(i);
        QString index = QString::number(i);
        mConfigScene.set(index + ".id", item->text(SCENE_COL_ID));
        mConfigScene.set(index + ".class", item->text(SCENE_COL_CLASS));
        mConfigScene.set(index + ".classFile", item->text(SCENE_COL_CLASS_FILE));
        mConfigScene.set(index + ".extra.contentLayoutFile", item->text(SCENE_COL_LAYOUT));
        mConfigScene.set(index + ".extra.page", item->text(SCENE_COL_PAGE));
    }
}

void NConfigWidget::editConfigAppJson() {
    EditJsonDialog dialog(this);
    this->syncAppWidgetToJson();
    dialog.setJsonText(mConfigApp.stringify());
    dialog.exec();
}

void NConfigWidget::editConfigSceneJson() {
    EditJsonDialog dialog(this);
    this->syncSceneWidgetToJson();
    dialog.setJsonText(mConfigScene.stringify());
    dialog.exec();
}


NConfigWidget::~NConfigWidget()
{
    delete ui;
}
