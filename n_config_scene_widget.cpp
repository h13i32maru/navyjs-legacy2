#include "window/n_text_dialog.h"
#include "n_config_scene_widget.h"
#include "n_util.h"
#include "ui_n_config_scene_widget.h"

#include <QMenu>
#include <QMessageBox>

NConfigSceneWidget::NConfigSceneWidget(const QDir &projectDir, const QString &filePath, QWidget *parent) : NFileWidget(projectDir, filePath, parent), ui(new Ui::NConfigSceneWidget)
{
    ui->setupUi(this);

    mConfigScene.parseFromFilePath(filePath);

    syncJsonToWidget();

    connect(ui->sceneConfigTreeWidget, SIGNAL(customContextMenuRequested(QPoint)), this, SLOT(contextMenu(QPoint)));
}

bool NConfigSceneWidget::save() {
    syncWidgetToJson();

    QFile configSceneFile(mFilePath);
    if (!configSceneFile.open(QIODevice::WriteOnly | QIODevice::Text)) {
        return false;
    }
    int ret = configSceneFile.write(this->mConfigScene.stringify());

    return (ret == -1 ? false: true);
}

void NConfigSceneWidget::syncJsonToWidget() {
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
        row[SCENE_COL_BGCOLOR] = scene.getStr("backgroundColor");
        QTreeWidgetItem *item = new QTreeWidgetItem(row);
        item->setFlags(item->flags() | Qt::ItemIsEditable);
        items.append(item);
    }
    ui->sceneConfigTreeWidget->clear();
    ui->sceneConfigTreeWidget->addTopLevelItems(items);
}

void NConfigSceneWidget::syncWidgetToJson() {
    mConfigScene.clear();
    for (int i = 0; i < ui->sceneConfigTreeWidget->topLevelItemCount(); i++) {
        QTreeWidgetItem *item = ui->sceneConfigTreeWidget->topLevelItem(i);
        QString index = QString::number(i);
        mConfigScene.set(index + ".id", item->text(SCENE_COL_ID));
        mConfigScene.set(index + ".class", item->text(SCENE_COL_CLASS));
        mConfigScene.set(index + ".classFile", item->text(SCENE_COL_CLASS_FILE));
        mConfigScene.set(index + ".extra.contentLayoutFile", item->text(SCENE_COL_LAYOUT));
        mConfigScene.set(index + ".extra.page", item->text(SCENE_COL_PAGE));
        mConfigScene.set(index + ".backgroundColor", item->text(SCENE_COL_BGCOLOR));
    }
}

void NConfigSceneWidget::showRawData() {
    NTextDialog dialog(this);
    this->syncWidgetToJson();
    dialog.setText(mConfigScene.stringify());
    dialog.exec();
}

void NConfigSceneWidget::newScene() {
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

void NConfigSceneWidget::removeScene() {
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

void NConfigSceneWidget::contextMenu(QPoint /*point*/) {
    QMenu menu(this);
    menu.addAction(tr("&New Scene"), this, SLOT(newScene()));
    menu.addAction(tr("&Remove Scene"), this, SLOT(removeScene()));
    menu.addSeparator();
    menu.addAction(tr("&Raw Data"), this, SLOT(showRawData()));
    menu.exec(QCursor::pos());
}

NConfigSceneWidget::~NConfigSceneWidget()
{
    delete ui;
}
