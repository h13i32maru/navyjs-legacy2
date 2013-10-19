#include "main_window.h"
#include "ui_main_window.h"
#include "util/n_util.h"
#include "n_code_widget.h"
#include "n_layout_widget.h"
#include "n_image_widget.h"
#include "n_config_app_widget.h"
#include "n_config_scene_widget.h"
#include "n_config_page_widget.h"
#include "n_project.h"

#include <QFileDialog>
#include <QDebug>
#include <QScreen>
#include <QMessageBox>
#include <QInputDialog>
#include <QProcess>

#include <window/n_file_opener.h>

MainWindow::MainWindow(QWidget *parent) : QMainWindow(parent), ui(new Ui::MainWindow)
{
    ui->setupUi(this);

    ui->mainToolBar->hide();
    ui->statusBar->hide();
    ui->fileTabWidget->hide();

    mProjectDir = new QDir(QDir::homePath());

    mFileSysteMmodel = new QFileSystemModel;
    mFileSysteMmodel->setReadOnly(false);
    mFileTreeView = ui->fileTreeView;
    mFileTreeView->setModel(mFileSysteMmodel);
    mFileTreeView->hideColumn(1);
    mFileTreeView->hideColumn(2);
    mFileTreeView->hideColumn(3);
    mFileTreeView->hideColumn(4);
    mFileTabWidget = ui->fileTabWidget;
    mTabBackgroundWidget = ui->noFileWidget;

    mPrefDialog = new NPrefDialog();
    mGoogleChromeProcess = new QProcess();

    connect(ui->actionPreferences, SIGNAL(triggered()), mPrefDialog, SLOT(exec()));
    connect(ui->actionNewProject, SIGNAL(triggered(bool)), this, SLOT(newProject()));
    connect(ui->actionOpenProject, SIGNAL(triggered(bool)), this, SLOT(openProject()));
    connect(ui->actionOpenFile, SIGNAL(triggered(bool)), this, SLOT(showFileOpener()));
    connect(ui->actionSaveAll, SIGNAL(triggered(bool)), this, SLOT(saveAll()));
    connect(ui->actionLaunchGoogleChrome, SIGNAL(triggered(bool)), this, SLOT(launchGoogleChrome()));
    connect(ui->actionValidate, SIGNAL(triggered()), this, SLOT(validate()));
    connect(ui->actionCloseTab, SIGNAL(triggered(bool)), this, SLOT(closeCurrentFile()));
    connect(ui->actionNextTab, SIGNAL(triggered(bool)), this, SLOT(nextFile()));
    connect(ui->actionPrevTab, SIGNAL(triggered(bool)), this, SLOT(prevFile()));

    connect(mFileTreeView, SIGNAL(customContextMenuRequested(QPoint)), this, SLOT(contextMenu(QPoint)));
    connect(mFileTreeView, SIGNAL(doubleClicked(QModelIndex)), this, SLOT(openFile(QModelIndex)));
    connect(mFileTreeView, SIGNAL(dropped(QString,QString)), this, SLOT(updateTabForDropped(QString,QString)));
    connect(mFileTabWidget, SIGNAL(tabCloseRequested(int)), this, SLOT(closeFile(int)));
    connect(mFileTabWidget, SIGNAL(currentChanged(int)), this, SLOT(tabChanged(int)));

}

void MainWindow::setCurrentProject(QString dirPath) {
    mProjectDir->setPath(dirPath);

    NProject::instance()->setProject(mProjectDir->absolutePath());

    QString rootDirPath = mProjectDir->absolutePath();
    mFileSysteMmodel->setRootPath(rootDirPath);
    //特定のディレクトリ以降のみを表示するための設定
    mFileTreeView->setRootIndex(mFileSysteMmodel->index(rootDirPath));

    mFileTabWidget->clear();

    // 特定のファイルは非表示にする
    NProject *project = NProject::instance();
    QModelIndex rootIndex = mFileTreeView->rootIndex();
    int row;
    row = mFileSysteMmodel->index(project->filePath("index.html")).row();
    mFileTreeView->setRowHidden(row, rootIndex, true);

    row = mFileSysteMmodel->index(project->filePath("index_creator.html")).row();
    mFileTreeView->setRowHidden(row, rootIndex, true);

    row = mFileSysteMmodel->index(project->filePath("creator")).row();
    mFileTreeView->setRowHidden(row, rootIndex, true);

    row = mFileSysteMmodel->index(project->filePath("navy")).row();
    mFileTreeView->setRowHidden(row, rootIndex, true);
}

void MainWindow::newProject()
{
    QString dirName = QFileDialog::getSaveFileName(this, tr("New Project"), QDir::homePath() + "/Desktop");

    if (dirName.isEmpty()) {
        return;
    }

    //FIXME: remove this code.
    if (QFile::exists(dirName)) {
        if (!QDir(dirName).removeRecursively()){
            return;
        }
    }

    NUtil::copyDir(":/template", dirName);
    setCurrentProject(dirName);
}

void MainWindow::openProject() {
    QString dirName = QFileDialog::getExistingDirectory(this, tr("Open Project"), QDir::homePath() + "/Desktop");

    if (dirName.isEmpty()) {
        return;
    }

    if (!QFile::exists(dirName)) {
        return;
    }

    setCurrentProject(dirName);

    // FIXME: remove this debug code.
    NProject *project = NProject::instance();
    QDir(project->filePath("navy")).removeRecursively();
    QDir(project->filePath("creator")).removeRecursively();
    NUtil::copyDir(":/template/navy", project->filePath("navy"));
    NUtil::copyDir(":/template/creator", project->filePath("creator"));
}

void MainWindow::showFileOpener() {
    NFileOpener opener(this);
    opener.setModal(true);
    int ret = opener.exec();
    if (ret == NFileOpener::Accepted) {
        QString filePath = NProject::instance()->filePath(opener.filePath());
        openFile(filePath);
    }
}

void MainWindow::saveAll() {
    if (NProject::instance()->projectName().isEmpty()) {
        return;
    }

    QTabWidget *tab = ui->fileTabWidget;
    for (int i = 0; i < tab->count(); i++) {
        saveFile(i);
    }
}

void MainWindow::launchGoogleChrome() {
    if (NProject::instance()->projectName().isEmpty()) {
        return;
    }

    int ret = QMessageBox::question(this, tr(""),
                tr("Do you want to launch the Google Chrome that enable cross-domain access and local file access?"));
    if (ret != QMessageBox::Yes) {
        return;
    }

    QSettings *s = mPrefDialog->getSettings();
    QString program = s->value(NPrefDialog::PREVIEW_GOOGLE_CHROME_PATH).toString();

    QStringList arguments;
    if (s->value(NPrefDialog::PREVIEW_ALLOW_FILE_ACCESS_FROM_FILE).toBool()) {
        arguments.append("--allow-file-access-from-files");
    }

    if (s->value(NPrefDialog::PREVIEW_DISABLE_WEB_SECURITY).toBool()) {
        arguments.append("--disable-web-security");
    }

    if (!s->value(NPrefDialog::PREVIEW_USER_DATA_DIR).toString().isEmpty()) {
        QString dirPath = s->value(NPrefDialog::PREVIEW_USER_DATA_DIR).toString();
        arguments.append("--user-data-dir=\"" + dirPath + "\"");
    }

    if (!s->value((NPrefDialog::PREVIEW_OTHER_OPTIONS)).toString().isEmpty()) {
        QStringList options = s->value(NPrefDialog::PREVIEW_OTHER_OPTIONS).toString().split(" ");
        arguments.append(options);
    }

    QString filePath = "file://" + NProject::instance()->filePath("index.html");
    arguments.append(filePath);

    if (mGoogleChromeProcess->state() == QProcess::NotRunning) {
        mGoogleChromeProcess->start(program, arguments);
        mGoogleChromeProcess->waitForFinished(1000);

        if (mGoogleChromeProcess->state() == QProcess::NotRunning) {
            QMessageBox::information(this, tr(""),
                tr("Google Chrome is already running. Please close Google Chrome."));
        }
    } else {
        QMessageBox::information(this, tr(""),
            tr("Google Chrome is already running. Please read the following URL to switch to Google Chrome.\n\n") + filePath);
    }
}

void MainWindow::validate() {
    if (NProject::instance()->projectName().isEmpty()) {
        return;
    }

    NProject::instance()->validate();
}

QList<int> MainWindow::searchTabIndexesByPath(const QString &path, const bool &isDir) {
    QList<int> indexes;

    if (isDir) {
        int tabNum = mFileTabWidget->count();
        for (int i = 0; i < tabNum; i++) {
            NFileWidget *widget = (NFileWidget *)mFileTabWidget->widget(i);
            QString filePath = widget->filePath();
            if (filePath.indexOf(path) == 0) {
                indexes.append(i);
            }
        }
    } else {
        int tabNum = mFileTabWidget->count();
        for (int i = 0; i < tabNum; i++) {
            NFileWidget *widget = (NFileWidget *)mFileTabWidget->widget(i);
            QString filePath = widget->filePath();
            if (QString::compare(path, filePath) == 0) {
                indexes.append(i);
            }
        }
    }

    return indexes;
}

void MainWindow::updateTabForPathChanged(const QString &oldPath, const QString &newPath) {
    QFileInfo newPathInfo(newPath);
    QList<int> indexes  = searchTabIndexesByPath(oldPath, newPathInfo.isDir());

    for (int i = 0; i < indexes.length(); i++) {
        int index = indexes[i];
        NFileWidget *fileWidget = (NFileWidget *)mFileTabWidget->widget(index);
        QString filePath = fileWidget->filePath();
        filePath = newPath + filePath.remove(0, oldPath.length());
        fileWidget->setFilePath(filePath);

        QString oldTabText = mFileTabWidget->tabText(index);
        if (oldTabText[oldTabText.length() - 1] == '*') {
            mFileTabWidget->setTabText(index, QFileInfo(filePath).fileName() + "*");
        } else {
            mFileTabWidget->setTabText(index, QFileInfo(filePath).fileName());
        }
    }
}

void MainWindow::updateTabForDropped(QString dropDirPath, QString selectedFilePath) {
    QString fileName = QFileInfo(selectedFilePath).fileName();
    QString newFilePath = QDir(dropDirPath).absoluteFilePath(fileName);

    updateTabForPathChanged(selectedFilePath, newFilePath);
}

void MainWindow::updateTabForPathDeleted(const QString &path, const bool &isDir) {
    QList<int> indexes = searchTabIndexesByPath(path, isDir);

    for (int i = 0; i < indexes.length(); i++) {
        mFileTabWidget->removeTab(indexes[i]);
    }
}

void MainWindow::updateTabForFileChanged(NFileWidget *fileWidget) {
    int tabIndex = mFileTabWidget->indexOf(fileWidget);
    if (tabIndex == -1) {
        return;
    }

    QString tabText = mFileTabWidget->tabText(tabIndex);

    if (tabText[tabText.length() - 1] != '*') {
        mFileTabWidget->setTabText(tabIndex, tabText + "*");
    }
}

bool MainWindow::isFileContentChanged(int tabIndex) {
    NFileWidget *fileWidget = (NFileWidget *)mFileTabWidget->widget(tabIndex);
    return fileWidget->isChanged();
}
void MainWindow::openFile(QModelIndex index) {
    QString filePath = ((QFileSystemModel *) mFileTreeView->model())->filePath(index);
    openFile(filePath);
}

void MainWindow::openFile(const QString &filePath) {
    if (QFileInfo(filePath).isDir()) {
        return;
    }

    QList<int> tabIndexes = searchTabIndexesByPath(filePath, false);

    // already open tab for file path;
    if (tabIndexes.length() > 0) {
        mFileTabWidget->setCurrentIndex(tabIndexes[0]);
        return;
    }

    NFileWidget *fileWidget = NULL;
    switch(NProject::instance()->fileType(filePath)) {
    case NProject::TYPE_CONFIG_APP:    fileWidget = new NConfigAppWidget(filePath); break;
    case NProject::TYPE_CONFIG_SCENE:  fileWidget = new NConfigSceneWidget(filePath); break;
    case NProject::TYPE_CONFIG_PAGE:   fileWidget = new NConfigPageWidget(filePath); break;
    case NProject::TYPE_CODE:          fileWidget = new NCodeWidget(filePath); break;
    case NProject::TYPE_LAYOUT:        fileWidget = new NLayoutWidget(filePath); break;
    case NProject::TYPE_IMAGE:         fileWidget = new NImageWidget(filePath); break;
    default: return;
    }

    connect(fileWidget, SIGNAL(changed(NFileWidget*)), this, SLOT(updateTabForFileChanged(NFileWidget*)));

    QString fileName = QFileInfo(filePath).fileName();
    fileWidget->setObjectName(filePath);
    int tabIndex = mFileTabWidget->addTab(fileWidget, fileName);
    mFileTabWidget->setCurrentIndex(tabIndex);

    mFileTabWidget->show();
    mTabBackgroundWidget->hide();
}

void MainWindow::closeFile(int tabIndex) {
    if (isFileContentChanged(tabIndex)) {
        QMessageBox msgBox;
        msgBox.setText("this file has been modified.");
        msgBox.setInformativeText("do you want to save your changes?");
        msgBox.setStandardButtons(QMessageBox::Save | QMessageBox::Discard | QMessageBox::Cancel);
        msgBox.setDefaultButton(QMessageBox::Save);
        int ret = msgBox.exec();

        switch (ret) {
        bool saveResult;
        case QMessageBox::Save:
            saveResult = saveFile(tabIndex);
            if (!saveResult) {
                return;
            }
            break;
        case QMessageBox::Discard:
            break;
        case QMessageBox::Cancel:
            return;
            break;
        }
    }

    mFileTabWidget->removeTab(tabIndex);

    if (mFileTabWidget->count() == 0) {
        mFileTabWidget->hide();
        mTabBackgroundWidget->show();
    }
}

void MainWindow::closeCurrentFile() {
    int index = mFileTabWidget->currentIndex();
    closeFile(index);
}

void MainWindow::nextFile() {
    int index = mFileTabWidget->currentIndex();
    if (index + 1 < mFileTabWidget->count()) {
        mFileTabWidget->setCurrentIndex(index + 1);
    }
}

void MainWindow::prevFile() {
    int index = mFileTabWidget->currentIndex();
    if (index - 1 >= 0 ) {
        mFileTabWidget->setCurrentIndex(index - 1);
    }
}

bool MainWindow::saveFile(int tabIndex) {
    if (!isFileContentChanged(tabIndex)) {
        return true;
    }

    NFileWidget *fileWidget = (NFileWidget *)mFileTabWidget->widget(tabIndex);
    int ret = fileWidget->save();
    if (ret == -1) {
        QMessageBox::critical(this, tr("fail save file."), tr("fail save file.") + "\n" + fileWidget->filePath());
        return false;
    }

    // 保存が完了したのでタブ名の*を取り除く
    QString tabName = mFileTabWidget->tabText(tabIndex);
    mFileTabWidget->setTabText(tabIndex, tabName.remove(tabName.length() - 1, 1));

    return true;
}

void MainWindow::newJSFile() {
    QString fileName = QInputDialog::getText(this, tr("New File"), tr("create new file"), QLineEdit::Normal, "code.js");
    QString parentPath = NUtil::selectedPath(mFileTreeView);
    NUtil::newFile(parentPath, fileName, "js");
}

void MainWindow::newLayoutFile() {
    QString fileName = QInputDialog::getText(this, tr("New File"), tr("create new file"), QLineEdit::Normal, "layout.json");
    QString parentPath = NUtil::selectedPath(mFileTreeView);

    QString filePath = NUtil::createFilePath(parentPath, fileName, "json");
    if (filePath.isEmpty()) {
        return;
    }

    NUtil::createFileFromTemplate(":/template_code/layout.json", filePath);
}

void MainWindow::newDir() {
    QString dirName = QInputDialog::getText(this, tr("New Directory"), tr("create new directory"), QLineEdit::Normal, "directory");
    QString parentPath = NUtil::selectedPath(mFileTreeView);
    NUtil::newDir(parentPath, dirName);
}

void MainWindow::importJS() {
    QStringList files = QFileDialog::getOpenFileNames(this, "Select one or more files to open", QDir::homePath(), "Text (*.js)");

    QString parentPath = NUtil::selectedPath(mFileTreeView);
    for (int i = 0; i < files.length(); i++) {
        NUtil::importFile(parentPath, files[i]);
    }
}

void MainWindow::importLayout() {
    QStringList files = QFileDialog::getOpenFileNames(this, "Select one or more files to open", QDir::homePath(), "Text (*.json)");

    QString parentPath = NUtil::selectedPath(mFileTreeView);
    for (int i = 0; i < files.length(); i++) {
        NUtil::importFile(parentPath, files[i]);
    }
}

void MainWindow::importImage() {
    QStringList files = QFileDialog::getOpenFileNames(this, "Select one or more files to open", QDir::homePath(), "Image (*.png *.gif *.jpge *.jpg)");

    QString parentPath = NUtil::selectedPath(mFileTreeView);
    for (int i = 0; i < files.length(); i++) {
        NUtil::importFile(parentPath, files[i]);
    }
}

void MainWindow::deletePath() {
    QString path = NUtil::selectedPath(mFileTreeView);
    bool isDir = QFileInfo(path).isDir();
    bool ret = NUtil::deletePath(path);

    if (ret) {
        updateTabForPathDeleted(path, isDir);
    }
}

void MainWindow::renamePath() {
    QString newName = QInputDialog::getText(this, tr("Rename File"), tr("enter new name"));
    QString srcPath = NUtil::selectedPath(mFileTreeView);
    QString ext = QFileInfo(srcPath).suffix();
    QString newPath = NUtil::renamePath(srcPath, newName, ext);

    if (newPath.isEmpty()) {
        return;
    }

    updateTabForPathChanged(srcPath, newPath);
}

void MainWindow::copyPath() {
    QString srcPath = NUtil::selectedPath(mFileTreeView);
    QString ext = QFileInfo(srcPath).suffix();
    QString fileName = "copy_" + QFileInfo(srcPath).fileName();

    QString newName = QInputDialog::getText(this, tr("Copy File"), tr("enter copy name"), QLineEdit::Normal, fileName);
    NUtil::copyPath(srcPath, newName, ext);
}

void MainWindow::contextMenu(QPoint point) {
    // 選択されたところが何もない場所なら、操作を何もさせない
    QModelIndex index = mFileTreeView->indexAt(point);
    if (!index.isValid()) {
        mFileTreeView->setCurrentIndex(mFileTreeView->rootIndex());
        mFileTreeView->clearSelection();
        return;
    }

    QString filePath = mFileSysteMmodel->filePath(index);

    QMenu menu(this);
    QMenu *subMenu = menu.addMenu(tr("&New"));
    switch(NProject::instance()->fileType(filePath)) {
    case NProject::TYPE_CODE_DIR:
    case NProject::TYPE_CODE:
        subMenu->addAction("javascript", this, SLOT(newJSFile()));
        subMenu->addAction(tr("&Directory"), this, SLOT(newDir()));
        menu.addAction(tr("&Import"), this, SLOT(importJS()));
        menu.addSeparator();
        menu.addAction(tr("&Rename"), this, SLOT(renamePath()));
        menu.addAction(tr("&Copy"), this, SLOT(copyPath()));
        menu.addAction(tr("&Delete"), this, SLOT(deletePath()));

        menu.exec(QCursor::pos());
        break;
    case NProject::TYPE_LAYOUT_DIR:
    case NProject::TYPE_LAYOUT:
        subMenu->addAction("layout", this, SLOT(newLayoutFile()));
        subMenu->addAction(tr("&Directory"), this, SLOT(newDir()));
        menu.addAction(tr("&Import"), this, SLOT(importLayout()));
        menu.addSeparator();
        menu.addAction(tr("&Rename"), this, SLOT(renamePath()));
        menu.addAction(tr("&Copy"), this, SLOT(copyPath()));
        menu.addAction(tr("&Delete"), this, SLOT(deletePath()));

        menu.exec(QCursor::pos());
        break;
    case NProject::TYPE_IMAGE_DIR:
    case NProject::TYPE_IMAGE:
        subMenu->addAction(tr("&Directory"), this, SLOT(newDir()));
        menu.addAction(tr("&Import"), this, SLOT(importImage()));
        menu.addSeparator();
        menu.addAction(tr("&Rename"), this, SLOT(renamePath()));
        menu.addAction(tr("&Copy"), this, SLOT(copyPath()));
        menu.addAction(tr("&Delete"), this, SLOT(deletePath()));

        menu.exec(QCursor::pos());
        break;
    default:
        return;
    }
}

void MainWindow::tabChanged(int index) {
    NFileWidget *widget = (NFileWidget *)mFileTabWidget->widget(index);
    if (widget == NULL) {
        return;
    }

    widget->refreshForActive();
}

MainWindow::~MainWindow()
{
    delete ui;
}
