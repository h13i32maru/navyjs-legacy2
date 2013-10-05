#include "window/n_text_dialog.h"
#include "n_config_page_widget.h"
#include "util/n_util.h"
#include "ui_n_config_page_widget.h"

#include <QCompleter>
#include <QMenu>
#include <QMessageBox>

NConfigPageWidget::NConfigPageWidget(const QDir &projectDir, const QString &filePath, QWidget *parent) : NFileWidget(projectDir, filePath, parent), ui(new Ui::NConfigPageWidget)
{
    /*
    ui->setupUi(this);

    mConfigPage.parseFromFilePath(filePath);

    syncJsonToWidget();

    connect(ui->pageConfigTreeWidget, SIGNAL(customContextMenuRequested(QPoint)), this, SLOT(contextMenu(QPoint)));
    */
    ui->setupUi(this);

    mConfigPage.parseFromFilePath(filePath);
    syncJsonToTree();

    {
        QStringList codeList = NUtil::recursiveEntryList(mProjectDir.absoluteFilePath("code"), "code/");
        QCompleter *completer = new QCompleter(codeList, this);
        completer->setModelSorting(QCompleter::CaseInsensitivelySortedModel);
        completer->setCaseSensitivity(Qt::CaseInsensitive);
        ui->classFileEdit->setCompleter(completer);
    }

    {
        QStringList layoutList = NUtil::recursiveEntryList(mProjectDir.absoluteFilePath("layout"), "layout/");
        QCompleter *completer = new QCompleter(layoutList, this);
        completer->setModelSorting(QCompleter::CaseInsensitivelySortedModel);
        completer->setCaseSensitivity(Qt::CaseInsensitive);
        ui->layoutEdit->setCompleter(completer);
    }

    connect(ui->pageConfigTreeWidget, SIGNAL(customContextMenuRequested(QPoint)), this, SLOT(contextMenu(QPoint)));
    connect(ui->pageConfigTreeWidget, SIGNAL(currentItemChanged(QTreeWidgetItem*,QTreeWidgetItem*)), this, SLOT(syncTreeItemToForm(QTreeWidgetItem*)));
    connect(ui->updateButton, SIGNAL(clicked(bool)), this, SLOT(syncFormToJson()));
}

//bool NConfigPageWidget::innerSave() {
//    syncWidgetToJson();

//    QFile configPageFile(mFilePath);
//    if (!configPageFile.open(QIODevice::WriteOnly | QIODevice::Text)) {
//        return false;
//    }
//    int ret = configPageFile.write(this->mConfigPage.stringify());

//    return (ret == -1 ? false: true);
//}
//void NConfigPageWidget::newPage() {
//    int count = ui->pageConfigTreeWidget->topLevelItemCount();
//    QString suffix = QString::number(count);
//    QStringList row;
//    NUtil::expand(row, ui->pageConfigTreeWidget->columnCount());
//    row[PAGE_COL_ID] = "Page" + suffix;
//    row[PAGE_COL_CLASS] = "Page" + suffix;
//    row[PAGE_COL_CLASS_FILE] = "code/page" + suffix + ".js";
//    row[PAGE_COL_LAYOUT] = "layout/page" + suffix + ".json";
//    QTreeWidgetItem *item = new QTreeWidgetItem(row);
//    item->setFlags(item->flags() | Qt::ItemIsEditable);
//    ui->pageConfigTreeWidget->insertTopLevelItem(count, item);
//}

//void NConfigPageWidget::removePage() {
//    QList<QTreeWidgetItem *> selectedItems = ui->pageConfigTreeWidget->selectedItems();
//    if (selectedItems.length() == 0) {
//        return;
//    }

//    QTreeWidgetItem *item = selectedItems[0];

//    QMessageBox msgBox;
//    msgBox.setText(tr("Do you remove page?"));
//    msgBox.setInformativeText(item->text(PAGE_COL_ID));
//    msgBox.setStandardButtons(QMessageBox::Ok | QMessageBox::Cancel);
//    msgBox.setDefaultButton(QMessageBox::Cancel);
//    int ret = msgBox.exec();
//    if (ret == QMessageBox::Ok) {
//        ui->pageConfigTreeWidget->takeTopLevelItem(ui->pageConfigTreeWidget->indexOfTopLevelItem(item));
//    }
//}


//void NConfigPageWidget::contextMenu(QPoint /*point*/) {
//    QMenu menu(this);
//    menu.addAction(tr("&New Page"), this, SLOT(newPage()));
//    menu.addAction(tr("&Remove Page"), this, SLOT(removePage()));
//    menu.addSeparator();
//    menu.addAction(tr("&Edit Raw Data"), this, SLOT(showRawData()));
//    menu.exec(QCursor::pos());
//}

//void NConfigPageWidget::syncJsonToWidget() {
//    QList<QTreeWidgetItem *> items;
//    for (int i = 0; i < mConfigPage.length(); i++) {
//        NJson page = mConfigPage.getObject(QString::number(i));
//        QStringList row;
//        NUtil::expand(row, ui->pageConfigTreeWidget->columnCount());
//        row[PAGE_COL_ID] = page.getStr("id");
//        row[PAGE_COL_CLASS] = page.getStr("class");
//        row[PAGE_COL_CLASS_FILE] = page.getStr("classFile");
//        row[PAGE_COL_LAYOUT] = page.getStr("extra.contentLayoutFile");
//        row[PAGE_COL_BGCOLOR] = page.getStr("backgroundColor");
//        QTreeWidgetItem *item = new QTreeWidgetItem(row);
//        item->setFlags(item->flags() | Qt::ItemIsEditable);
//        items.append(item);
//    }
//    ui->pageConfigTreeWidget->clear();
//    ui->pageConfigTreeWidget->addTopLevelItems(items);
//}

//void NConfigPageWidget::syncWidgetToJson() {
//    mConfigPage.clear();
//    for (int i = 0; i < ui->pageConfigTreeWidget->topLevelItemCount(); i++) {
//        QTreeWidgetItem *item = ui->pageConfigTreeWidget->topLevelItem(i);
//        QString index = QString::number(i);
//        mConfigPage.set(index + ".id", item->text(PAGE_COL_ID));
//        mConfigPage.set(index + ".class", item->text(PAGE_COL_CLASS));
//        mConfigPage.set(index + ".classFile", item->text(PAGE_COL_CLASS_FILE));
//        mConfigPage.set(index + ".extra.contentLayoutFile", item->text(PAGE_COL_LAYOUT));
//        mConfigPage.set(index + ".backgroundColor", item->text(PAGE_COL_BGCOLOR));
//    }
//}

//void NConfigPageWidget::showRawData() {
//    NTextDialog dialog(this);
//    this->syncWidgetToJson();
//    dialog.setText(mConfigPage.stringify());
//    dialog.exec();
//}

bool NConfigPageWidget::innerSave() {
    QFile configPageFile(mFilePath);
    if (!configPageFile.open(QIODevice::WriteOnly | QIODevice::Text)) {
        return false;
    }
    int ret = configPageFile.write(this->mConfigPage.stringify());

    return (ret == -1 ? false: true);
}

int NConfigPageWidget::countPage(const QString &pageId) {
    int count = 0;

    for (int i = 0; i < mConfigPage.length(); i++) {
        QString index = QString::number(i);
        QString id = mConfigPage.getStr(index + ".id");

        if (pageId == id) {
            count++;
        }
    }

    return count;
}

int NConfigPageWidget::searchPage(const QString &pageId) {
    for (int i = 0; i < mConfigPage.length(); i++) {
        QString index = QString::number(i);
        QString id = mConfigPage.getStr(index + ".id");

        if (pageId == id) {
            return i;
        }
    }

    return -1;
}

void NConfigPageWidget::syncJsonToTree() {
    ui->pageConfigTreeWidget->clear();

    QList<QTreeWidgetItem *> items;
    for (int i = 0; i < mConfigPage.length(); i++) {
        QString index = QString::number(i);
        NJson page = mConfigPage.getObject(index);
        QStringList row;
        NUtil::expand(row, ui->pageConfigTreeWidget->columnCount());
        row[PAGE_COL_ID] = page.getStr("id");
        row[PAGE_COL_CLASS] = page.getStr("class");
        row[PAGE_COL_CLASS_FILE] = page.getStr("classFile");
        row[PAGE_COL_LAYOUT] = page.getStr("extra.contentLayoutFile");
        row[PAGE_COL_BGCOLOR] = page.getStr("backgroundColor");
        QTreeWidgetItem *item = new QTreeWidgetItem(row);
        items.append(item);
    }

    ui->pageConfigTreeWidget->addTopLevelItems(items);
}

void NConfigPageWidget::syncPageToForm(const QString &pageId) {
    mCurrentIndex = searchPage(pageId);
    QString index = QString::number(mCurrentIndex);
    NJson page = mConfigPage.getObject(index);

    ui->idEdit->setText(page.getStr("id"));
    ui->classEdit->setText(page.getStr("class"));
    ui->classFileEdit->setText(page.getStr("classFile"));
    ui->backgroundColorEdit->setText(page.getStr("backgroundColor"));
    ui->layoutEdit->setText(page.getStr("extra.contentLayoutFile"));
}

void NConfigPageWidget::syncTreeItemToForm(QTreeWidgetItem *item) {
    // 何も選択されなくなった時はNULLが渡ってくる
    if (item == NULL) {
        return;
    }

    QString pageId = item->text(PAGE_COL_ID);
    syncPageToForm(pageId);
}

void NConfigPageWidget::syncFormToJson() {
    // id check
    QString pageId = ui->idEdit->text();
    int pageIndex = searchPage(pageId);
    int pageCount = countPage(pageId);
    if (pageCount == 0) {
        // pass
    }
    else if (pageIndex == mCurrentIndex && pageCount == 1) {
        // pass
    } else {
        QMessageBox::critical(this, tr("exist page id"), tr("exist page id"));
        return;
    }

    // class check
    QString class_ = ui->classEdit->text();
    if (class_.isEmpty()) {
        return;
    }

    // class file check.
    QString classFile = ui->classFileEdit->text();
    QFileInfo classFileInfo(mProjectDir.absoluteFilePath(classFile));
    if (!classFileInfo.exists()) {
        int ret = QMessageBox::question(NULL, tr("create class file."), tr("do you create class file?"));
        if (ret == QMessageBox::Yes) {
            QString path = mProjectDir.absoluteFilePath(classFile);
            QMap<QString, QString> replace;
            replace["{{class}}"] = class_;
            NUtil::createFileFromTemplate(":/template_code/page.js", path, replace);
        } else {
            return;
        }
    }

    // layout check
    QString layoutFile = ui->layoutEdit->text();
    QFileInfo layoutFileInfo(mProjectDir.absoluteFilePath(layoutFile));
    if (!layoutFileInfo.exists()) {
        int ret = QMessageBox::question(NULL, tr("create layout file."), tr("do you create layout file?"));
        if (ret == QMessageBox::Yes) {
            QString path = mProjectDir.absoluteFilePath(layoutFile);
            NUtil::createFileFromTemplate(":/template_code/layout.json", path);
        } else {
            return;
        }
    }

    QString index = QString::number(mCurrentIndex);
    mConfigPage.set(index + ".id", ui->idEdit->text());
    mConfigPage.set(index + ".class", ui->classEdit->text());
    mConfigPage.set(index + ".classFile", ui->classFileEdit->text());
    mConfigPage.set(index + ".backgroundColor", ui->backgroundColorEdit->text());
    mConfigPage.set(index + ".extra.contentLayoutFile", ui->layoutEdit->text());

    syncJsonToTree();

    // 編集されたことを伝える
    changed();

    ui->pageConfigTreeWidget->setDisabled(false);
}

void NConfigPageWidget::selectPage(const QString &pageId) {
    QTreeWidget *tree = ui->pageConfigTreeWidget;

    for (int i = 0; i < tree->topLevelItemCount(); i++) {
        QTreeWidgetItem * item = tree->topLevelItem(i);
        QString id = item->text(PAGE_COL_ID);
        if (id == pageId) {
            tree->setCurrentItem(item);
        }
    }
}

void NConfigPageWidget::showRawData() {
    NTextDialog dialog(this);
    dialog.setText(mConfigPage.stringify());
    dialog.exec();
}

void NConfigPageWidget::newPage() {
    //FIXME: idの重複チェックが必要

    QString index = QString::number(mConfigPage.length());

    mConfigPage.set(index + ".id", "Page" + index);
    mConfigPage.set(index + ".class", "Page" + index);
    mConfigPage.set(index + ".classFile", "code/page" + index + ".js");
    mConfigPage.set(index + ".extra.contentLayoutFile", "layout/page" + index + ".json");

    syncJsonToTree();
    selectPage("Page" + index);

    ui->pageConfigTreeWidget->setDisabled(true);
}

void NConfigPageWidget::removePage() {
    // FIXME: Sceneから参照されていないかチェックする必要あり

    QList<QTreeWidgetItem *> selectedItems = ui->pageConfigTreeWidget->selectedItems();
    if (selectedItems.length() == 0) {
        return;
    }

    QTreeWidgetItem *item = selectedItems[0];

    int ret = QMessageBox::question(NULL, tr(""), tr("do you remove page?"));

    if (ret == QMessageBox::Yes) {
        int index = searchPage(item->text(PAGE_COL_ID));
        mConfigPage.remove(QString::number(index));
        syncJsonToTree();
    }
}

void NConfigPageWidget::contextMenu(QPoint /*point*/) {
    QMenu menu(this);
    menu.addAction(tr("&New Page"), this, SLOT(newPage()));
    menu.addAction(tr("&Remove Page"), this, SLOT(removePage()));
    menu.addSeparator();
    menu.addAction(tr("&Raw Data"), this, SLOT(showRawData()));
    menu.exec(QCursor::pos());
}

NConfigPageWidget::~NConfigPageWidget()
{
    delete ui;
}
